using System.Security.Claims;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Qa;

public sealed record EditQaAnswerRequest(string? Text);

public sealed class EditQaAnswer : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapPut("/qa/answers/{answerId:guid}", Handle)
              .RequireAuthorization()
              .RequireRateLimiting(RateLimitPolicies.Write)
              .WithTags("QA");

    private static async Task<IResult> Handle(
        Guid answerId, EditQaAnswerRequest req, ClaimsPrincipal principal, AppDbContext db,
        QaSettings cfg, TimeProvider clock, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        var text = TextRules.Normalize(req.Text);
        var error = new Validator()
            .Check(text.Length is >= 2 and <= 1000 && TextRules.Clean(text, allowNewlines: true), "Cevap 2 ile 1000 karakter arasında olmalı.")
            .ToError();
        if (error is not null) return Result.Failure(error).ToProblem();

        // Başkasının cevabı da "bulunamadı" döner: varlığı sızdırılmaz.
        var questionId = await db.QaAnswers.AsNoTracking()
            .Where(a => a.Id == answerId && a.AuthorId == userId).Select(a => (Guid?)a.QuestionId).FirstOrDefaultAsync(ct);
        if (questionId is null)
            return Result.Failure(Error.NotFound("answer_not_found", "Cevap bulunamadı.")).ToProblem();

        return await db.RunInTransactionAsync<IResult>(async token =>
        {
            var q = await db.FindQuestionLockedAsync(questionId.Value, token); // en iyi seçimiyle yarışı kapatır
            if (q is null)
                return Result.Failure(Error.NotFound("qa_question_not_found", "Soru bulunamadı.")).ToProblem();
            if (q.BestAnswerId == answerId)
                return Result.Failure(Error.Conflict("answer_locked", "En iyi cevap seçildiği için artık düzenlenemez.")).ToProblem();

            var a = await db.QaAnswers.AsNoTracking().FirstAsync(x => x.Id == answerId, token);
            var now = clock.GetUtcNow().UtcDateTime;
            if (now >= a.CreatedAtUtc.AddSeconds(cfg.EditWindowSeconds))
                return Result.Failure(Error.Conflict("edit_window_closed",
                    $"Cevabı yalnızca ilk {cfg.EditWindowSeconds / 60.0:0.#} dakika içinde düzenleyebilirsin.")).ToProblem();

            if (a.Text != text)
                await db.QaAnswers.Where(x => x.Id == answerId).ExecuteUpdateAsync(s => s
                    .SetProperty(x => x.Text, text)
                    .SetProperty(x => x.EditedAtUtc, (DateTime?)now), token);

            var updated = await db.QaAnswers.AsNoTracking().FirstAsync(x => x.Id == answerId, token);
            var name = await db.Users.AsNoTracking().Where(u => u.Id == userId).Select(u => u.DisplayName).FirstAsync(token);
            return Results.Ok(QaMapping.ToDto(updated, name, userId, isBest: false, cfg));
        }, ct);
    }
}