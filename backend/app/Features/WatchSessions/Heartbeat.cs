using System.Security.Claims;
using Dersakis.Domain.Entities;
using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;

namespace Dersakis.Features.WatchSessions;

public sealed record HeartbeatRequest(int? PositionMs);
public sealed record WatchProgressDto(Guid SessionId, string Status, int WatchedMs, int DurationMs);

public sealed class Heartbeat : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapPost("/watch-sessions/{sessionId:guid}/heartbeat", Handle)
              .RequireAuthorization()
              .RequireRateLimiting(RateLimitPolicies.Heartbeat)
              .WithTags("Watch");

    private static async Task<IResult> Handle(
        Guid sessionId, HeartbeatRequest req, ClaimsPrincipal principal,
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

            if (s.Status == WatchStatus.Completed) return Results.Ok(Dto(s)); // tamamlanmışa gelen geç heartbeat zararsız
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
            await db.SaveChangesAsync(token);
            return Results.Ok(Dto(s));
        }, ct);
    }

    internal static WatchProgressDto Dto(WatchSession s)
        => new(s.Id, s.Status.ToString(), s.WatchedMs, s.VideoDurationMs);
}