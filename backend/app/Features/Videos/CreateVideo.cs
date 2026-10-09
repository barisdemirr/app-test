using System.Security.Claims;
using Dersakis.Domain.Entities;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Videos;

public sealed record QuestionInput(string? Text, string? CorrectAnswer, string[]? WrongAnswers, string? Explanation);
public sealed record CreateVideoRequest(Guid? CourseId, string? Title, string? Topic, QuestionInput[]? Questions);
public sealed record CreateVideoResponse(Guid Id, string Status, string UploadUrl);

public sealed class CreateVideo : IEndpoint
{
    private const string DefaultExplanation = "Üretici bu soru için açıklama eklemedi.";

    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapPost("/videos", Handle)
              .RequireAuthorization()
              .RequireRateLimiting(RateLimitPolicies.Write)
              .RequireIdempotency()
              .WithTags("Videos");

    private static async Task<IResult> Handle(
        CreateVideoRequest req, ClaimsPrincipal principal, AppDbContext db,
        CreditService accountLock, VideoSettings settings, TimeProvider clock, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        var title = (req.Title ?? "").Trim();
        var topic = (req.Topic ?? "").Trim();

        var validator = new Validator()
            .Check(req.CourseId is { } cid && cid != Guid.Empty, "Ders seçilmeli.")
            .Check(title.Length is >= 3 and <= 70 && Clean(title), "Başlık 3 ile 70 karakter arasında olmalı.")
            .Check(topic.Length is >= 2 and <= 40 && Clean(topic), "Konu 2 ile 40 karakter arasında olmalı.")
            .Check(req.Questions is { Length: >= 1 and <= 2 }, "1 veya 2 soru eklemelisin.");

        var questions = new List<VideoQuestion>();
        if (req.Questions is { Length: >= 1 and <= 2 })
        {
            for (var i = 0; i < req.Questions.Length; i++)
            {
                var n = i + 1;
                var q = req.Questions[i];
                if (q is null) { validator.Check(false, $"Soru {n} boş olamaz."); continue; }

                var text = (q.Text ?? "").Trim();
                var correct = (q.CorrectAnswer ?? "").Trim();
                var wrong = (q.WrongAnswers ?? []).Select(w => (w ?? "").Trim()).ToArray();
                var explanation = (q.Explanation ?? "").Trim();
                var all = wrong.Prepend(correct).ToArray();

                validator
                    .Check(text.Length is >= 5 and <= 300 && Clean(text), $"Soru {n}: soru metni 5 ile 300 karakter olmalı.")
                    .Check(wrong.Length == 3, $"Soru {n}: tam 3 yanlış şık gerekli.")
                    .Check(all.All(a => a.Length is >= 1 and <= 150 && Clean(a)), $"Soru {n}: her şık 1 ile 150 karakter olmalı.")
                    .Check(new HashSet<string>(all, StringComparer.OrdinalIgnoreCase).Count == all.Length, $"Soru {n}: şıklar birbirinden farklı olmalı.")
                    .Check(explanation.Length <= 500 && Clean(explanation), $"Soru {n}: açıklama en fazla 500 karakter olmalı.");

                var question = new VideoQuestion
                {
                    Position = (byte)n,
                    Text = text,
                    Explanation = explanation.Length == 0 ? DefaultExplanation : explanation,
                    Options = all.Select((a, idx) => new VideoOption { Text = a, IsCorrect = idx == 0 }).ToList()
                };
                questions.Add(question);
            }
        }

        var error = validator.ToError();
        if (error is not null) return Result.Failure(error).ToProblem();

        var courseId = req.CourseId!.Value;
        if (!await db.Courses.AnyAsync(c => c.Id == courseId, ct))
            return Result.Failure(Error.NotFound("course_not_found", "Ders bulunamadı.")).ToProblem();

        // Kullanıcı satırını kilitle: günlük limit sayımı iki paralel istekte birlikte aşılamasın.
        if (!await accountLock.LockAccountAsync(userId, ct))
            return Result.Failure(Error.Unauthorized("user_not_found", "Hesap bulunamadı.")).ToProblem();

        var since = TurkeyClock.StartOfTodayUtc(clock);
        var today = await db.Videos.CountAsync(v => v.CreatorId == userId && v.CreatedAtUtc >= since, ct);
        if (today >= settings.MaxCreatesPerDay)
            return Result.Failure(Error.TooMany("daily_upload_limit",
                $"Günlük içerik limitine ({settings.MaxCreatesPerDay}) ulaştın. Yarın tekrar dene.")).ToProblem();

        var video = new Video { CreatorId = userId, CourseId = courseId, Title = title, Topic = topic, Questions = questions };
        db.Videos.Add(video);
        await db.SaveChangesAsync(ct);

        // Location header'ı idempotent tekrarda korunmadığı için adresi gövdede veriyoruz.
        return Results.Json(
            new CreateVideoResponse(video.Id, "Draft", $"/api/v1/videos/{video.Id}/content"),
            statusCode: StatusCodes.Status201Created);
    }

    /// <summary>Kontrol karakteri (satır sonu, null vb.) içeren metni reddeder.</summary>
    private static bool Clean(string s) => !s.Any(char.IsControl);
}