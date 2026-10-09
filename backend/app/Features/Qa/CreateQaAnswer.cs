using System.Security.Claims;
using Dersakis.Domain.Entities;
using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Qa;

public sealed record CreateQaAnswerRequest(string? Text);
public sealed record CreateQaAnswerResponse(QaAnswerDto Answer, int AnswerCount);

public sealed class CreateQaAnswer : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapPost("/qa/questions/{id:guid}/answers", Handle)
              .RequireAuthorization()
              .RequireRateLimiting(RateLimitPolicies.Write)
              .RequireIdempotency()
              .WithTags("QA");

    private static async Task<IResult> Handle(
        Guid id, CreateQaAnswerRequest req, ClaimsPrincipal principal, AppDbContext db,
        QaSettings cfg, TimeProvider clock, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        var text = TextRules.Normalize(req.Text);
        var error = new Validator()
            .Check(text.Length is >= 2 and <= 1000 && TextRules.Clean(text, allowNewlines: true), "Cevap 2 ile 1000 karakter arasında olmalı.")
            .ToError();
        if (error is not null) return Result.Failure(error).ToProblem();

        var now = clock.GetUtcNow().UtcDateTime;
        var answerId = Guid.CreateVersion7();

        return await db.RunInTransactionAsync<IResult>(async token =>
        {
            var q = await db.FindQuestionLockedAsync(id, token);
            if (q is null)
                return Result.Failure(Error.NotFound("qa_question_not_found", "Soru bulunamadı.")).ToProblem();
            if (q.AuthorId == userId)
                return Result.Failure(Error.Forbidden("own_question", "Kendi sorunu cevaplayamazsın.")).ToProblem();
            if (q.Mode != QaMode.Text)
                return Result.Failure(Error.Conflict("voice_question", "Sesli sorular yazılı cevapla yanıtlanamaz.")).ToProblem();
            if (q.BestAnswerId is not null)
                return Result.Failure(Error.Conflict("question_closed", "Bu soruda en iyi cevap seçildi, yeni cevap alınmıyor.")).ToProblem();

            if (await db.QaAnswers.AsNoTracking().AnyAsync(a => a.QuestionId == id && a.AuthorId == userId, token))
                return Result.Failure(Error.Conflict("already_answered", "Bu soruya zaten cevap verdin. 2 dakika içinde düzenleyebilirsin.")).ToProblem();

            // Atomik sayaç + ilk cevap zamanı (14 günlük seçim süresi buradan başlar)
            var rows = await db.QaQuestions
                .Where(x => x.Id == id && x.AnswerCount < cfg.MaxAnswersPerQuestion)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(x => x.AnswerCount, x => x.AnswerCount + 1)
                    .SetProperty(x => x.FirstAnswerAtUtc, x => x.FirstAnswerAtUtc ?? (DateTime?)now), token);
            if (rows == 0)
                return Result.Failure(Error.Conflict("question_full", "Bu soru en fazla cevap sayısına ulaştı.")).ToProblem();

            var answer = new QaAnswer { Id = answerId, CreatedAtUtc = now, QuestionId = id, AuthorId = userId, Text = text };
            db.QaAnswers.Add(answer);
            await db.SaveChangesAsync(token);

            var name = await db.Users.AsNoTracking().Where(u => u.Id == userId).Select(u => u.DisplayName).FirstAsync(token);
            var count = await db.QaQuestions.AsNoTracking().Where(x => x.Id == id).Select(x => x.AnswerCount).FirstAsync(token);

            return Results.Json(
                new CreateQaAnswerResponse(QaMapping.ToDto(answer, name, userId, isBest: false, cfg), count),
                statusCode: StatusCodes.Status201Created);
        }, ct);
    }
}