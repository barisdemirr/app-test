using System.Security.Claims;
using Dersakis.Domain.Entities;
using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Qa;

public sealed record CreateQaQuestionRequest(string? Category, string? Topic, string? Text, string? Mode);
public sealed record CreateQaQuestionResponse(QaQuestionDto Question, int Balance);

public sealed class CreateQaQuestion : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapPost("/qa/questions", Handle)
              .RequireAuthorization()
              .RequireRateLimiting(RateLimitPolicies.Write)
              .RequireIdempotency()
              .WithTags("QA");

    private static async Task<IResult> Handle(
        CreateQaQuestionRequest req, ClaimsPrincipal principal, AppDbContext db,
        CreditService credits, QaSettings cfg, TimeProvider clock, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        var topic = TextRules.Normalize(req.Topic);
        var text = TextRules.Normalize(req.Text);
        var modeText = (req.Mode ?? "Text").Trim();
        var category = cfg.Categories.FirstOrDefault(c =>
            string.Equals(c, (req.Category ?? "").Trim(), StringComparison.OrdinalIgnoreCase));

        var mode = QaMode.Text;
        var modeOk = modeText.All(char.IsLetter) && Enum.TryParse(modeText, ignoreCase: true, out mode) && Enum.IsDefined(mode);

        var error = new Validator()
            .Check(category is not null, "Geçerli bir kategori seç.")
            .Check(topic.Length <= 40 && TextRules.Clean(topic), "Konu en fazla 40 karakter olabilir.")
            .Check(text.Length is >= 5 and <= 500 && TextRules.Clean(text, allowNewlines: true), "Soru 5 ile 500 karakter arasında olmalı.")
            .Check(modeOk, "Mode 'Text' veya 'Voice' olmalı.")
            .ToError();
        if (error is not null) return Result.Failure(error).ToProblem();

        if (mode == QaMode.Voice && !cfg.VoiceEnabled)
            return Result.Failure(Error.Validation("voice_unavailable", "Sesli sorular henüz aktif değil.")).ToProblem();

        var cost = mode == QaMode.Voice ? cfg.VoiceQuestionCost : cfg.TextQuestionCost;
        var reward = mode == QaMode.Voice ? cfg.VoiceBestReward : cfg.TextBestReward;
        var id = Guid.CreateVersion7();
        var now = clock.GetUtcNow().UtcDateTime;

        return await db.RunInTransactionAsync<IResult>(async token =>
        {
            // 1) Kredi: bakiye yetmezse 409 insufficient_credits ve hiçbir şey yazılmaz. RefId = soru id'si.
            var spend = await credits.SpendAsync(userId, cost, CreditReason.QaQuestionSpend, id, token);
            if (spend.IsFailure) return spend.ToProblem();

            // 2) Soru, kredi ile AYNI transaction'da. Deadlock'ta lambda baştan çalışır, bu yüzden nesne burada üretilir.
            var question = new QaQuestion
            {
                Id = id,
                CreatedAtUtc = now,
                AuthorId = userId,
                Category = category!,
                Topic = topic,
                Text = text,
                Mode = mode,
                Cost = cost,
                Reward = reward
            };
            db.QaQuestions.Add(question);
            await db.SaveChangesAsync(token);

            var authorName = await db.Users.AsNoTracking().Where(u => u.Id == userId).Select(u => u.DisplayName).FirstAsync(token);
            return Results.Json(
                new CreateQaQuestionResponse(QaMapping.ToDto(question, authorName, userId, cfg), spend.Value.Balance),
                statusCode: StatusCodes.Status201Created);
        }, ct);
    }
}