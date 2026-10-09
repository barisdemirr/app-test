using System.Security.Claims;
using Dersakis.Domain.Entities;
using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Live;

public sealed record LiveJoinResponse(LiveSessionDto Session, LiveTokenDto Agora);

public sealed class JoinLiveSession : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapPost("/live/{id:guid}/join", Handle)
              .RequireAuthorization()
              .RequireRateLimiting(RateLimitPolicies.Write)
              .WithTags("Live");

    private static async Task<IResult> Handle(
        Guid id, ClaimsPrincipal principal, AppDbContext db, AgoraSettings agora, LiveSettings live,
        TimeProvider clock, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        if (!agora.IsConfigured)
            return Results.Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: "agora_not_configured",
                detail: "Canlı görüşme servisi henüz yapılandırılmadı.");

        try
        {
            await db.RunInTransactionAsync<bool>(async token =>
            {
                var now = clock.GetUtcNow().UtcDateTime;
                var s = await db.LiveSessions.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, token)
                        ?? throw NotFound();

                if (s.Kind == LiveKind.Voice) await JoinVoice(db, s, userId, live, now, token);
                else await JoinLesson(db, s, userId, now, token);
                return true;
            }, ct);
        }
        catch (LiveRejected r)
        {
            return r.Response; // transaction geri alındı
        }

        // Güncel hali oku, token ver
        var row = await LiveQueries.LoadAsync(db, id, ct);
        var nowAfter = clock.GetUtcNow().UtcDateTime;
        if (row is null || !LiveTokens.Allowed(row.Session, userId))
            return Result.Failure(Error.Conflict("session_closed", "Oturum artık katılıma açık değil.")).ToProblem();

        return Results.Ok(new LiveJoinResponse(
            LiveQueries.ToDto(row, userId, nowAfter),
            LiveTokens.Issue(row.Session, userId, agora, live, clock)));
    }

    // ---------- Sesli ----------
    private static async Task JoinVoice(AppDbContext db, LiveSession s, Guid userId, LiveSettings live, DateTime now, CancellationToken token)
    {
        var role = LiveQueries.RoleOf(s, userId);

        if (role == "none")
        {
            if (s.Status != LiveStatus.Open)
                throw s.Status is LiveStatus.Cancelled or LiveStatus.Expired
                    ? Conflict("session_closed", "Bu ilan kapandı.")
                    : Conflict("session_taken", "Bu ilana başka biri katıldı.");

            // Kullanıcı dostu ön kontroller. Asıl yarış koruması aşağıdaki koşullu UPDATE ve unique indexlerdir.
            var meBusy = await db.LiveSessions.AnyAsync(x =>
                (x.HostId == userId || x.GuestId == userId) && x.Status >= LiveStatus.Pending && x.Status <= LiveStatus.Live, token);
            if (meBusy) throw Conflict("already_in_session", "Zaten devam eden bir görüşmen var.");

            var hostBusy = await db.LiveSessions.AnyAsync(x =>
                (x.HostId == s.HostId || x.GuestId == s.HostId) && x.Status >= LiveStatus.Pending && x.Status <= LiveStatus.Live, token);
            if (hostBusy) throw Conflict("host_busy", "İlan sahibi şu an başka bir görüşmede.");

            var window = live.VoiceHostJoinWindowSeconds;
            var deadline = now.AddSeconds(window);

            int rows;
            try
            {
                rows = await db.LiveSessions
                    .Where(x => x.Id == s.Id && x.Status == LiveStatus.Open && x.GuestId == null && x.HostId != userId)
                    .ExecuteUpdateAsync(u => u
                        .SetProperty(x => x.GuestId, (Guid?)userId)
                        .SetProperty(x => x.Status, LiveStatus.Pending)
                        .SetProperty(x => x.GuestJoinedAtUtc, (DateTime?)now)
                        .SetProperty(x => x.JoinDeadlineUtc, (DateTime?)deadline)
                        .SetProperty(x => x.DueAtUtc, (DateTime?)deadline), token);
            }
            catch (Exception ex) when (LiveErrors.IsUniqueViolation(ex, "UX_LiveSessions_Host_Active"))
            {
                throw Conflict("host_busy", "İlan sahibi şu an başka bir görüşmede.");
            }
            catch (Exception ex) when (LiveErrors.IsUniqueViolation(ex, "UX_LiveSessions_Guest_Active"))
            {
                throw Conflict("already_in_session", "Zaten devam eden bir görüşmen var.");
            }

            if (rows == 0) throw Conflict("session_taken", "Bu ilana başka biri katıldı.");

            // Host'a push, durum değişikliğiyle AYNI transaction'da kuyruğa girer.
            NotificationOutbox.Enqueue(db, s.HostId, NotificationType.VoiceGuestJoined,
                "Birisi sorunla ilgileniyor",
                $"\"{s.Title}\" için bir kullanıcı bağlandı. {Math.Max(1, window / 60)} dakika içinde katıl.",
                new { action = "open_session", sessionId = s.Id, kind = "Voice" }, now, ttlSeconds: window);
            await db.SaveChangesAsync(token);
            return;
        }

        if (role == "guest")
        {
            // Tekrar çağrı güvenli: yeni token almak için.
            if (s.Status is LiveStatus.Pending or LiveStatus.Live) return;
            throw Conflict("session_closed", "Oturum artık katılıma açık değil.");
        }

        // role == host
        switch (s.Status)
        {
            case LiveStatus.Open:
                throw Conflict("waiting_for_guest", "Henüz kimse katılmadı.");
            case LiveStatus.Live:
                return;
            case LiveStatus.Pending:
                var rows = await db.LiveSessions
                    .Where(x => x.Id == s.Id && x.Status == LiveStatus.Pending && x.HostId == userId && x.JoinDeadlineUtc >= now)
                    .ExecuteUpdateAsync(u => u
                        .SetProperty(x => x.Status, LiveStatus.Live)
                        .SetProperty(x => x.HostJoinedAtUtc, (DateTime?)now)
                        .SetProperty(x => x.LiveStartedAtUtc, (DateTime?)now)
                        .SetProperty(x => x.DueAtUtc, (DateTime?)now.AddMinutes(live.VoiceMaxDurationMinutes)), token);
                if (rows == 1) return;

                // Başka bir istek araya girmiş olabilir: güncel durumu oku.
                var cur = await db.LiveSessions.AsNoTracking().Where(x => x.Id == s.Id).Select(x => x.Status).FirstAsync(token);
                if (cur == LiveStatus.Live) return;
                throw cur == LiveStatus.Pending
                    ? Conflict("join_window_closed", "Katılma süresi doldu.")
                    : Conflict("session_closed", "Oturum artık katılıma açık değil.");
            default:
                throw Conflict("session_closed", "Oturum artık katılıma açık değil.");
        }
    }

    // ---------- Eğitim (satın alma ve job 11.6-11.7'de gelecek, join şimdiden hazır) ----------
    private static async Task JoinLesson(AppDbContext db, LiveSession s, Guid userId, DateTime now, CancellationToken token)
    {
        var role = LiveQueries.RoleOf(s, userId);
        if (role == "none") throw NotFound();

        if (s.Status == LiveStatus.Live) return;
        if (s.Status == LiveStatus.Booked)
            throw Conflict("not_started_yet", "Eğitim henüz başlamadı.");
        if (s.Status != LiveStatus.Waiting)
            throw Conflict("session_closed", "Oturum artık katılıma açık değil.");

        // Kendi katılım zamanını (varsa dokunmadan) yaz. Satır kilidi eşzamanlı joinleri sıraya dizer.
        var open = db.LiveSessions.Where(x => x.Id == s.Id && x.Status == LiveStatus.Waiting && x.JoinDeadlineUtc >= now);
        var rows = role == "host"
            ? await open.ExecuteUpdateAsync(u => u.SetProperty(x => x.HostJoinedAtUtc, x => x.HostJoinedAtUtc ?? now), token)
            : await open.ExecuteUpdateAsync(u => u.SetProperty(x => x.GuestJoinedAtUtc, x => x.GuestJoinedAtUtc ?? now), token);

        if (rows == 0)
        {
            var cur = await db.LiveSessions.AsNoTracking().Where(x => x.Id == s.Id).Select(x => x.Status).FirstAsync(token);
            if (cur == LiveStatus.Live) return;
            throw cur == LiveStatus.Waiting
                ? Conflict("join_window_closed", "Katılma süresi doldu.")
                : Conflict("session_closed", "Oturum artık katılıma açık değil.");
        }

        // İkisi de geldiyse görüşme başlar. Biri kazanır, diğeri 0 satır alır ve zaten Live görür.
        var end = s.ScheduledAtUtc!.Value.AddMinutes(s.DurationMinutes!.Value);
        await db.LiveSessions
            .Where(x => x.Id == s.Id && x.Status == LiveStatus.Waiting && x.HostJoinedAtUtc != null && x.GuestJoinedAtUtc != null)
            .ExecuteUpdateAsync(u => u
                .SetProperty(x => x.Status, LiveStatus.Live)
                .SetProperty(x => x.LiveStartedAtUtc, (DateTime?)now)
                .SetProperty(x => x.DueAtUtc, (DateTime?)end), token);
    }

    private static LiveRejected NotFound() => LiveRejected.From(Error.NotFound("live_session_not_found", "Oturum bulunamadı."));
    private static LiveRejected Conflict(string code, string msg) => LiveRejected.From(Error.Conflict(code, msg));
}