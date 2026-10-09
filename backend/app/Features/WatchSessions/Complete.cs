using System.Security.Claims;
using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;

namespace Dersakis.Features.WatchSessions;

public sealed record CompleteRequest(int? PositionMs);
public sealed record CompleteResponse(Guid SessionId, Guid VideoId, string Status, bool AlreadyCompleted);

public sealed class Complete : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapPost("/watch-sessions/{sessionId:guid}/complete", Handle)
              .RequireAuthorization()
              .RequireRateLimiting(RateLimitPolicies.Watch)
              .WithTags("Watch");

    private static async Task<IResult> Handle(
        Guid sessionId, CompleteRequest req, ClaimsPrincipal principal,
        AppDbContext db, WatchSettings cfg, TimeProvider clock, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        if (req.PositionMs is null or < 0)
            return Result.Failure(Error.Validation("invalid_position", "positionMs 0 veya daha büyük olmalı.")).ToProblem();
        var position = req.PositionMs.Value;

        return await db.RunInTransactionAsync<IResult>(async token =>
        {
            var s = await db.FindLockedAsync(sessionId, userId, token);
            if (s is null)
                return Result.Failure(Error.NotFound("session_not_found", "İzleme oturumu bulunamadı.")).ToProblem();

            // İki paralel complete: ikincisi kilidi bekler, burada "zaten tamamlandı" görür.
            if (s.Status == WatchStatus.Completed)
                return Results.Ok(new CompleteResponse(s.Id, s.VideoId, "Completed", AlreadyCompleted: true));
            if (s.Status != WatchStatus.Active)
                return Result.Failure(Error.Conflict("session_not_active", "Oturum kapanmış. Yeni oturum başlat.")).ToProblem();

            var now = clock.GetUtcNow().UtcDateTime;
            if (WatchProgress.IsExpired(s, now, cfg))
            {
                s.Status = WatchStatus.Abandoned;
                await db.SaveChangesAsync(token);
                return Result.Failure(Error.Conflict("session_expired", "Oturum süresi doldu. Yeni oturum başlat.")).ToProblem();
            }

            WatchProgress.Apply(s, position, now);

            if (!WatchProgress.IsComplete(s, cfg, out var requiredMs))
            {
                await db.SaveChangesAsync(token); // ilerleme kaybolmasın
                return Results.Problem(
                    statusCode: StatusCodes.Status409Conflict,
                    title: "watch_incomplete",
                    detail: "Videoyu henüz yeterince izlemedin.",
                    extensions: new Dictionary<string, object?>
                    {
                        ["watchedMs"] = s.WatchedMs,
                        ["requiredMs"] = requiredMs,
                        ["remainingMs"] = Math.Max(0, requiredMs - s.WatchedMs),
                        ["positionMs"] = s.LastPositionMs,
                        ["durationMs"] = s.VideoDurationMs
                    });
            }

            s.Status = WatchStatus.Completed;
            s.CompletedAtUtc = now;
            await db.SaveChangesAsync(token);

            return Results.Ok(new CompleteResponse(s.Id, s.VideoId, "Completed", AlreadyCompleted: false));
        }, ct);
    }
}