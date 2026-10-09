using Dersakis.Domain.Entities;
using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Live;

internal enum LiveMoney { None, RefundPayer, PayEarner }

/// <summary>Canlı oturumlarda kredi hareketinin TEK kapısı. Çağıran, bir transaction içinde olmalıdır.</summary>
internal static class LiveSettlement
{
    /// <summary>
    /// 1) Satırı koşullu UPDATE ile ele geçirir (from durumunda ve escrow değişmemişse). Başka biri önce davrandıysa false döner.
    /// 2) Ele geçirdiyse parayı hareket ettirir. Kredi servisi hata verirse istisna fırlar ve her şey geri alınır.
    /// </summary>
    public static async Task<bool> SettleAsync(
        AppDbContext db, CreditService credits, LiveSession s,
        LiveStatus from, LiveStatus to, LiveOutcome outcome, LiveMoney money, DateTime now, CancellationToken ct)
    {
        var escrow = s.EscrowCredits;
        var rows = await db.LiveSessions
            .Where(x => x.Id == s.Id && x.Status == from && x.EscrowCredits == escrow)
            .ExecuteUpdateAsync(u => u
                .SetProperty(x => x.Status, to)
                .SetProperty(x => x.Outcome, outcome)
                .SetProperty(x => x.EscrowCredits, 0)
                .SetProperty(x => x.SettledAtUtc, (DateTime?)now)
                .SetProperty(x => x.EndedAtUtc, x => x.EndedAtUtc ?? (DateTime?)now)
                .SetProperty(x => x.DueAtUtc, (DateTime?)null), ct);
        if (rows == 0) return false;

        if (escrow <= 0) return true;

        if (money == LiveMoney.RefundPayer && s.PayerId is { } payer)
        {
            var reason = s.Kind == LiveKind.Voice ? CreditReason.LiveVoiceRefund : CreditReason.LiveLessonRefund;
            var r = await credits.GrantAsync(payer, escrow, reason, s.Id, ct);
            if (r.IsFailure) throw new LiveRejected(r.ToProblem());
        }
        else if (money == LiveMoney.PayEarner && s.EarnerId is { } earner && s.Payout > 0)
        {
            // Sesli: Payout < Price, aradaki fark (Price - Payout) sistemden çıkar. Eğitim: Payout = Price.
            var reason = s.Kind == LiveKind.Voice ? CreditReason.LiveVoiceReward : CreditReason.LiveLessonEarning;
            var r = await credits.GrantAsync(earner, s.Payout, reason, s.Id, ct);
            if (r.IsFailure) throw new LiveRejected(r.ToProblem());
        }
        return true;
    }

    /// <summary>Live → AwaitingApproval. Ödeyene onay isteği gider. Başkası önce bitirdiyse false.</summary>
    public static async Task<bool> EndAsync(AppDbContext db, LiveSettings live, LiveSession s, DateTime now, CancellationToken ct)
    {
        var deadline = now.AddHours(live.ApprovalWindowHours);
        var rows = await db.LiveSessions
            .Where(x => x.Id == s.Id && x.Status == LiveStatus.Live)
            .ExecuteUpdateAsync(u => u
                .SetProperty(x => x.Status, LiveStatus.AwaitingApproval)
                .SetProperty(x => x.EndedAtUtc, (DateTime?)now)
                .SetProperty(x => x.ApprovalDeadlineUtc, (DateTime?)deadline)
                .SetProperty(x => x.DueAtUtc, (DateTime?)deadline), ct);
        if (rows == 0) return false;

        var voice = s.Kind == LiveKind.Voice;
        Notify(db, s.PayerId!.Value, NotificationType.ApprovalRequested,
            voice ? "Görüşme bitti" : "Eğitim bitti",
            (voice ? "Sorunun cevabını aldın mı?" : "Eğitimden memnun kaldın mı?") +
            $" {live.ApprovalWindowHours} saat içinde yanıtlamazsan onaylanmış sayılır.",
            s, "review_session", now);
        await db.SaveChangesAsync(ct);
        return true;
    }

    public static void Notify(
        AppDbContext db, Guid userId, NotificationType type, string title, string body,
        LiveSession s, string action, DateTime now, int? ttlSeconds = null)
        => NotificationOutbox.Enqueue(db, userId, type, title, body,
            new { action, sessionId = s.Id, kind = s.Kind.ToString() }, now, ttlSeconds);
}