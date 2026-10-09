using Dersakis.Domain.Entities;
using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Quiz;

public sealed record AnswerRequest(Guid? OptionId);

public sealed record AnswerResponse(
    Guid QuestionId, bool IsCorrect, Guid SelectedOptionId, Guid CorrectOptionId, string Explanation,
    int CreditAwarded, int Balance, bool DailyCapReached, bool AlreadyAnswered);

public sealed class AnswerQuestion : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapPost("/questions/{questionId:guid}/answer", Handle)
              .RequireAuthorization()
              .RequireRateLimiting(RateLimitPolicies.Answer)
              .WithTags("Quiz");

    private static async Task<IResult> Handle(
        Guid questionId, AnswerRequest req, HttpContext http, AppDbContext db,
        CreditService credits, CreditSettings settings, CancellationToken ct)
    {
        if (http.User.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();
        if (req.OptionId is null || req.OptionId == Guid.Empty)
            return Result.Failure(Error.Validation("validation_failed", "optionId gerekli.")).ToProblem();
        var optionId = req.OptionId.Value;

        return await db.RunInTransactionAsync<IResult>(async token =>
        {
            // 1) Hesap kilidi İLK iş: bu kullanıcının cevapları ve kredi işlemleri buradan sonra tek tek sıraya girer.
            if (!await credits.LockAccountAsync(userId, token))
                return Result.Failure(Error.Unauthorized("user_not_found", "Hesap bulunamadı.")).ToProblem();

            var q = await (
                from x in db.VideoQuestions.AsNoTracking()
                join v in db.Videos.AsNoTracking() on x.VideoId equals v.Id
                where x.Id == questionId && v.Status == VideoStatus.Published
                select new { x.Id, x.VideoId, x.Explanation, v.CreatorId })
                .FirstOrDefaultAsync(token);
            if (q is null)
                return Result.Failure(Error.NotFound("question_not_found", "Soru bulunamadı.")).ToProblem();
            if (q.CreatorId == userId)
                return Result.Failure(Error.Forbidden("own_video", "Kendi videonun sorularından kredi kazanamazsın.")).ToProblem();

            var correctOptionId = await db.VideoOptions.AsNoTracking()
                .Where(o => o.QuestionId == questionId && o.IsCorrect).Select(o => o.Id).FirstAsync(token);

            // 2) Daha önce cevaplanmış mı? Kilit sayesinde bu kontrol yarışsız. Varsa ilk sonuç aynen döner.
            var prev = await db.QuizAttempts.AsNoTracking()
                .FirstOrDefaultAsync(a => a.UserId == userId && a.QuestionId == questionId, token);
            if (prev is not null)
                return Results.Ok(await BuildAsync(db, userId, questionId, prev.SelectedOptionId, correctOptionId,
                    q.Explanation, prev.IsCorrect, prev.CreditAwarded, settings, alreadyAnswered: true, token));

            // 3) Video tamamen izlenmiş olmalı
            var watched = await db.WatchSessions.AsNoTracking().AnyAsync(w =>
                w.UserId == userId && w.VideoId == q.VideoId && w.Status == WatchStatus.Completed, token);
            if (!watched)
                return Result.Failure(Error.Forbidden("watch_required", "Soruyu cevaplamak için videoyu sonuna kadar izlemelisin.")).ToProblem();

            // 4) Seçilen şık bu soruya ait mi
            if (!await db.VideoOptions.AsNoTracking().AnyAsync(o => o.Id == optionId && o.QuestionId == questionId, token))
                return Result.Failure(Error.Validation("invalid_option", "Seçilen şık bu soruya ait değil.")).ToProblem();

            // 5) Doğruysa kredi: referans = soru id'si (ledger unique index'i ikinci güvence)
            var isCorrect = optionId == correctOptionId;
            var awarded = 0;
            if (isCorrect)
            {
                var earn = await credits.EarnAsync(userId, settings.QuizReward, CreditReason.QuizCorrect, questionId, token);
                if (earn.IsFailure)
                    throw new InvalidOperationException($"Quiz kredisi verilemedi: {earn.Error!.Code}"); // transaction geri alınır
                awarded = earn.Value.Applied; // tavan dolmuşsa 0, azsa kalan kadar
            }

            // 6) Cevap kaydı, kredi ile AYNI transaction'da
            db.QuizAttempts.Add(new QuizAttempt
            {
                UserId = userId,
                QuestionId = questionId,
                VideoId = q.VideoId,
                SelectedOptionId = optionId,
                IsCorrect = isCorrect,
                CreditAwarded = awarded
            });
            await db.SaveChangesAsync(token);

            return Results.Ok(await BuildAsync(db, userId, questionId, optionId, correctOptionId,
                q.Explanation, isCorrect, awarded, settings, alreadyAnswered: false, token));
        }, ct);
    }

    private static async Task<AnswerResponse> BuildAsync(
        AppDbContext db, Guid userId, Guid questionId, Guid selected, Guid correct, string explanation,
        bool isCorrect, int awarded, CreditSettings settings, bool alreadyAnswered, CancellationToken ct)
    {
        var balance = await db.Users.AsNoTracking().Where(u => u.Id == userId).Select(u => u.CreditBalance).FirstAsync(ct);
        return new AnswerResponse(questionId, isCorrect, selected, correct, explanation, awarded, balance,
            DailyCapReached: isCorrect && awarded < settings.QuizReward, alreadyAnswered);
    }
}