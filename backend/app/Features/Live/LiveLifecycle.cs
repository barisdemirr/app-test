using Dersakis.Domain.Entities;
using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Live;

internal static class LiveLifecycle
{
    /// <summary>Vakti gelmiş TEK oturumu işler. Her şey bir transaction'da: ya hepsi olur, ya hiçbiri.</summary>
    public static Task<bool> ProcessAsync(
        AppDbContext db, CreditService credits, LiveSettings live, TimeProvider clock, Guid id, CancellationToken ct)
        => db.RunInTransactionAsync<bool>(async token =>
        {
            db.ChangeTracker.Clear(); // yeniden deneme durumunda önceki denemeden kalan kayıtlar taşınmasın
            var now = clock.GetUtcNow().UtcDateTime;

            var s = await db.LiveSessions.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, token);
            if (s?.DueAtUtc is not { } due || due > now) return false; // arada başkası işlemiş ya da vakit gelmemiş

            var done = (s.Kind, s.Status) switch
            {
                (LiveKind.Voice, LiveStatus.Open) => await VoiceOpenExpired(db, credits, s, now, token),
                (LiveKind.Voice, LiveStatus.Pending) => await VoiceHostMissed(db, credits, s, now, token),
                (LiveKind.Lesson, LiveStatus.Listed) => await LessonUnsold(db, credits, s, now, token),
                (LiveKind.Lesson, LiveStatus.Booked) => await LessonOpenWindow(db, credits, live, s, now, token),
                (LiveKind.Lesson, LiveStatus.Waiting) => await LessonWindowClosed(db, credits, s, now, token),
                (_, LiveStatus.Live) => await LiveSettlement.EndAsync(db, live, s, now, token),
                (_, LiveStatus.AwaitingApproval) => await AutoApprove(db, credits, s, now, token),
                _ => false
            };

            if (done) await db.SaveChangesAsync(token);
            return done;
        }, ct);

    // ---------- Sesli ----------
    private static async Task<bool> VoiceOpenExpired(AppDbContext db, CreditService credits, LiveSession s, DateTime now, CancellationToken ct)
    {
        if (!await LiveSettlement.SettleAsync(db, credits, s, LiveStatus.Open, LiveStatus.Expired,
                LiveOutcome.NoGuest, LiveMoney.RefundPayer, now, ct)) return false;
        LiveSettlement.Notify(db, s.HostId, NotificationType.VoiceExpired, "Sesli ilanın süresi doldu",
            $"Kimse katılmadığı için {s.Price} kredin iade edildi.", s, "open_session", now);
        return true;
    }

    private static async Task<bool> VoiceHostMissed(AppDbContext db, CreditService credits, LiveSession s, DateTime now, CancellationToken ct)
    {
        if (!await LiveSettlement.SettleAsync(db, credits, s, LiveStatus.Pending, LiveStatus.Cancelled,
                LiveOutcome.HostNoShow, LiveMoney.RefundPayer, now, ct)) return false;
        if (s.GuestId is { } guest)
            LiveSettlement.Notify(db, guest, NotificationType.VoiceHostMissed, "Görüşme iptal edildi",
                "İlan sahibi zamanında katılamadı. Başka bir ilana göz atabilirsin.", s, "open_session", now);
        LiveSettlement.Notify(db, s.HostId, NotificationType.SessionSettled, "Oturum iptal edildi",
            $"Zamanında katılmadığın için oturum iptal edildi, {s.Price} kredin iade edildi.", s, "open_session", now);
        return true;
    }

    // ---------- Eğitim ----------
    private static async Task<bool> LessonUnsold(AppDbContext db, CreditService credits, LiveSession s, DateTime now, CancellationToken ct)
    {
        if (!await LiveSettlement.SettleAsync(db, credits, s, LiveStatus.Listed, LiveStatus.Expired,
                LiveOutcome.NoGuest, LiveMoney.None, now, ct)) return false;
        LiveSettlement.Notify(db, s.HostId, NotificationType.LessonCancelled, "Eğitimin satılmadı",
            $"\"{s.Title}\" için kimse kayıt olmadı, ilan kapandı.", s, "open_session", now);
        return true;
    }

    private static async Task<bool> LessonOpenWindow(
        AppDbContext db, CreditService credits, LiveSettings live, LiveSession s, DateTime now, CancellationToken ct)
    {
        var deadline = s.ScheduledAtUtc!.Value.AddMinutes(live.LessonJoinWindowMinutes);

        // Pencere zaten kapanmışsa (ör. job uzun süre durduysa) açmadan doğrudan iptal ve iade.
        if (now >= deadline)
            return await CancelBothNoShow(db, credits, s, LiveStatus.Booked, now, ct);

        int rows;
        try
        {
            rows = await db.LiveSessions
                .Where(x => x.Id == s.Id && x.Status == LiveStatus.Booked)
                .ExecuteUpdateAsync(u => u
                    .SetProperty(x => x.Status, LiveStatus.Waiting)
                    .SetProperty(x => x.JoinDeadlineUtc, (DateTime?)deadline)
                    .SetProperty(x => x.DueAtUtc, (DateTime?)deadline), ct);
        }
        catch (Exception ex) when (LiveErrors.IsUniqueViolation(ex, "UX_LiveSessions_Host_Active")
                                   || LiveErrors.IsUniqueViolation(ex, "UX_LiveSessions_Guest_Active"))
        {
            // Taraflardan biri o an başka bir görüşmede. Satır "vakti geldi" kalır, sonraki turda tekrar denenir.
            // Pencere kapanırsa yukarıdaki dal normal "gelmedi" kuralıyla sonuçlandırır.
            return false;
        }
        if (rows == 0) return false;

        var ttl = live.LessonJoinWindowMinutes * 60;
        foreach (var uid in new[] { s.HostId, s.GuestId!.Value })
            LiveSettlement.Notify(db, uid, NotificationType.LessonStarting, "Eğitim başlıyor",
                $"\"{s.Title}\" başladı. {live.LessonJoinWindowMinutes} dakika içinde katıl.", s, "open_session", now, ttl);
        return true;
    }

    private static async Task<bool> LessonWindowClosed(AppDbContext db, CreditService credits, LiveSession s, DateTime now, CancellationToken ct)
    {
        var host = s.HostJoinedAtUtc != null;
        var guest = s.GuestJoinedAtUtc != null;

        if (host && guest)
        {
            // Normalde join zaten Live'a çevirir. Bir şekilde kaldıysa düzelt.
            var end = s.ScheduledAtUtc!.Value.AddMinutes(s.DurationMinutes!.Value);
            var rows = await db.LiveSessions.Where(x => x.Id == s.Id && x.Status == LiveStatus.Waiting)
                .ExecuteUpdateAsync(u => u
                    .SetProperty(x => x.Status, LiveStatus.Live)
                    .SetProperty(x => x.LiveStartedAtUtc, (DateTime?)now)
                    .SetProperty(x => x.DueAtUtc, (DateTime?)end), ct);
            return rows == 1;
        }

        if (host)
        {
            // Yalnızca eğitmen geldi: onay beklenmeden eğitmene ödeme.
            if (!await LiveSettlement.SettleAsync(db, credits, s, LiveStatus.Waiting, LiveStatus.Completed,
                    LiveOutcome.GuestNoShow, LiveMoney.PayEarner, now, ct)) return false;
            LiveSettlement.Notify(db, s.HostId, NotificationType.SessionSettled, "Kredi kazandın",
                $"Öğrenci gelmediği için eğitim ücreti (+{s.Payout}) hesabına geçti.", s, "open_session", now);
            LiveSettlement.Notify(db, s.GuestId!.Value, NotificationType.SessionSettled, "Eğitime katılmadın",
                "Süre içinde katılmadığın için eğitim ücreti iade edilmedi.", s, "open_session", now);
            return true;
        }

        if (guest)
        {
            // Yalnızca öğrenci geldi: eğitmen gelmedi, tam iade.
            if (!await LiveSettlement.SettleAsync(db, credits, s, LiveStatus.Waiting, LiveStatus.Cancelled,
                    LiveOutcome.HostNoShow, LiveMoney.RefundPayer, now, ct)) return false;
            LiveSettlement.Notify(db, s.GuestId!.Value, NotificationType.LessonCancelled, "Eğitim iptal edildi",
                $"Eğitmen katılmadı, {s.Price} kredin iade edildi.", s, "open_session", now);
            LiveSettlement.Notify(db, s.HostId, NotificationType.LessonCancelled, "Eğitim iptal edildi",
                "Süre içinde katılmadığın için eğitim iptal edildi.", s, "open_session", now);
            return true;
        }

        return await CancelBothNoShow(db, credits, s, LiveStatus.Waiting, now, ct);
    }

    private static async Task<bool> CancelBothNoShow(AppDbContext db, CreditService credits, LiveSession s, LiveStatus from, DateTime now, CancellationToken ct)
    {
        if (!await LiveSettlement.SettleAsync(db, credits, s, from, LiveStatus.Cancelled,
                LiveOutcome.BothNoShow, LiveMoney.RefundPayer, now, ct)) return false;
        LiveSettlement.Notify(db, s.GuestId!.Value, NotificationType.LessonCancelled, "Eğitim iptal edildi",
            $"Kimse katılmadığı için eğitim iptal edildi, {s.Price} kredin iade edildi.", s, "open_session", now);
        LiveSettlement.Notify(db, s.HostId, NotificationType.LessonCancelled, "Eğitim iptal edildi",
            "Kimse katılmadığı için eğitim iptal edildi.", s, "open_session", now);
        return true;
    }

    // ---------- Ortak ----------
    private static async Task<bool> AutoApprove(AppDbContext db, CreditService credits, LiveSession s, DateTime now, CancellationToken ct)
    {
        if (!await LiveSettlement.SettleAsync(db, credits, s, LiveStatus.AwaitingApproval, LiveStatus.Completed,
                LiveOutcome.AutoApproved, LiveMoney.PayEarner, now, ct)) return false;
        if (s.EarnerId is { } earner)
            LiveSettlement.Notify(db, earner, NotificationType.SessionSettled, "Kredi kazandın",
                $"+{s.Payout} kredi hesabına geçti.", s, "open_session", now);
        return true;
    }
}