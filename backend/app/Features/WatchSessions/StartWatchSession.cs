using System.Security.Claims;
using Dersakis.Domain.Entities;
using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.WatchSessions;

public sealed record StartWatchResponse(
    Guid? SessionId, Guid VideoId, int DurationMs, int WatchedMs, bool AlreadyCompleted, int HeartbeatIntervalMs);

public sealed class StartWatchSession : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapPost("/videos/{videoId:guid}/watch-sessions", Handle)
              .RequireAuthorization()
              .RequireRateLimiting(RateLimitPolicies.Watch)
              .WithTags("Watch");

    private static async Task<IResult> Handle(
        Guid videoId, ClaimsPrincipal principal, AppDbContext db, WatchSettings cfg, TimeProvider clock, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        for (var attempt = 0; attempt < 3; attempt++)
        {
            try
            {
                return await db.RunInTransactionAsync<IResult>(token => StartAsync(db, cfg, clock, userId, videoId, token), ct);
            }
            catch (DbUpdateException ex) when (ex.IsUniqueViolation())
            {
                // Aynı kullanıcının iki paralel start isteği: kaybeden baştan dener ve kazananın oturumunu görür.
            }
        }

        return Result.Failure(Error.Conflict("start_conflict", "Oturum başlatılamadı, tekrar dene.")).ToProblem();
    }

    private static async Task<IResult> StartAsync(
        AppDbContext db, WatchSettings cfg, TimeProvider clock, Guid userId, Guid videoId, CancellationToken ct)
    {
        var now = clock.GetUtcNow().UtcDateTime;

        var durationMs = await db.Videos.AsNoTracking()
            .Where(v => v.Id == videoId && v.Status == VideoStatus.Published)
            .Select(v => v.DurationMs).FirstOrDefaultAsync(ct);
        if (durationMs is not > 0)
            return Result.Failure(Error.NotFound("video_not_found", "Video bulunamadı.")).ToProblem();

        // Bu videoyu zaten tamamlamış: yeni oturuma gerek yok, doğrudan sorulara geçebilir.
        var completed = await db.WatchSessions.AsNoTracking()
            .AnyAsync(w => w.UserId == userId && w.VideoId == videoId && w.Status == WatchStatus.Completed, ct);
        if (completed)
            return Results.Ok(new StartWatchResponse(null, videoId, durationMs.Value, durationMs.Value, true, cfg.HeartbeatIntervalMs));

        // Kullanıcı başına tek aktif oturum: başka videoda açık olan oturumları kapat.
        await db.WatchSessions
            .Where(w => w.UserId == userId && w.Status == WatchStatus.Active && w.VideoId != videoId)
            .ExecuteUpdateAsync(s => s.SetProperty(w => w.Status, WatchStatus.Abandoned), ct);

        var active = await db.WatchSessions
            .FirstOrDefaultAsync(w => w.UserId == userId && w.Status == WatchStatus.Active && w.VideoId == videoId, ct);

        if (active is not null)
        {
            if (!WatchProgress.IsExpired(active, now, cfg))
                return Results.Ok(new StartWatchResponse(active.Id, videoId, active.VideoDurationMs, active.WatchedMs, false, cfg.HeartbeatIntervalMs));

            // Süresi dolmuş: kapat ve unique index boşalsın diye hemen yaz, sonra yenisini aç.
            active.Status = WatchStatus.Abandoned;
            await db.SaveChangesAsync(ct);
        }

        var session = new WatchSession
        {
            UserId = userId,
            VideoId = videoId,
            VideoDurationMs = durationMs.Value,
            CreatedAtUtc = now,
            LastHeartbeatAtUtc = now
        };
        db.WatchSessions.Add(session);
        await db.SaveChangesAsync(ct);

        return Results.Json(
            new StartWatchResponse(session.Id, videoId, durationMs.Value, 0, false, cfg.HeartbeatIntervalMs),
            statusCode: StatusCodes.Status201Created);
    }
}