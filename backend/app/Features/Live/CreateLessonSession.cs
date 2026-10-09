using System.Security.Claims;
using Dersakis.Domain.Entities;
using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Live;

public sealed record CreateLessonRequest(
    Guid? CourseId, string? Title, string? Description,
    DateTimeOffset? ScheduledAt, int? DurationMinutes, int? Price);

public sealed record CreateLessonResponse(LiveSessionDto Session);

public sealed class CreateLessonSession : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapPost("/live/lessons", Handle)
              .RequireAuthorization()
              .RequireRateLimiting(RateLimitPolicies.Write)
              .RequireIdempotency()
              .WithTags("Live");

    private static async Task<IResult> Handle(
        CreateLessonRequest req, ClaimsPrincipal principal, AppDbContext db, CreditService credits,
        LiveSettings live, TimeProvider clock, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        var title = TextRules.Normalize(req.Title) ?? "";
        var description = TextRules.Normalize(req.Description) ?? "";
        var now0 = clock.GetUtcNow().UtcDateTime;
        var scheduled = req.ScheduledAt?.UtcDateTime;

        var error = new Validator()
            .Check(req.CourseId is { } c && c != Guid.Empty, "Ders seçmelisin.")
            .Check(title.Length is >= 3 and <= 80 && TextRules.Clean(title), "Başlık 3 ile 80 karakter arasında olmalı.")
            .Check(description.Length is >= 5 and <= 500 && TextRules.Clean(description, allowNewlines: true),
                "Açıklama 5 ile 500 karakter arasında olmalı.")
            .Check(req.Price is { } p && p >= live.LessonMinPrice && p <= live.LessonMaxPrice,
                $"Fiyat {live.LessonMinPrice} ile {live.LessonMaxPrice} kredi arasında olmalı.")
            .Check(req.DurationMinutes is { } d && d >= live.LessonMinDurationMinutes && d <= live.LessonMaxDurationMinutes,
                $"Süre {live.LessonMinDurationMinutes} ile {live.LessonMaxDurationMinutes} dakika arasında olmalı.")
            .Check(scheduled is { } sa && sa >= now0.AddMinutes(live.LessonMinLeadMinutes) && sa <= now0.AddDays(live.LessonMaxLeadDays),
                $"Eğitim en az {live.LessonMinLeadMinutes} dakika sonrasına, en fazla {live.LessonMaxLeadDays} gün sonrasına planlanabilir.")
            .ToError();
        if (error is not null) return Result.Failure(error).ToProblem();

        var courseId = req.CourseId!.Value;
        var start = scheduled!.Value;
        var duration = req.DurationMinutes!.Value;
        var price = req.Price!.Value;

        try
        {
            var sessionId = await db.RunInTransactionAsync<Guid>(async token =>
            {
                if (!await credits.LockAccountAsync(userId, token))
                    throw LiveRejected.From(Error.Unauthorized("user_not_found", "Hesap bulunamadı."));

                if (!await db.Courses.AnyAsync(x => x.Id == courseId, token))
                    throw LiveRejected.From(Error.NotFound("course_not_found", "Ders bulunamadı."));

                var open = await db.LiveSessions.CountAsync(
                    x => x.HostId == userId && x.Kind == LiveKind.Lesson && x.Status == LiveStatus.Listed, token);
                if (open >= live.MaxOpenLessonListingsPerUser)
                    throw LiveRejected.From(Error.Conflict("open_listing_limit",
                        $"En fazla {live.MaxOpenLessonListingsPerUser} satıştaki eğitimin olabilir."));

                if (await LiveSchedule.OverlapsAsync(db, live, userId, start, start.AddMinutes(duration), Guid.Empty, token))
                    throw LiveRejected.From(Error.Conflict("schedule_conflict", "Bu saatte başka bir eğitimin var."));

                var id = Guid.CreateVersion7();
                var now = clock.GetUtcNow().UtcDateTime;
                db.LiveSessions.Add(LiveSession.NewLesson(id, now, userId, courseId, title, description, price, start, duration));
                await db.SaveChangesAsync(token);
                return id;
            }, ct);

            var row = await LiveQueries.LoadAsync(db, sessionId, ct);
            return Results.Json(
                new CreateLessonResponse(LiveQueries.ToDto(row!, userId, clock.GetUtcNow().UtcDateTime)),
                statusCode: StatusCodes.Status201Created);
        }
        catch (LiveRejected r)
        {
            return r.Response;
        }
    }
}