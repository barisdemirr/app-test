using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Live;

internal static class LiveSchedule
{
    /// <summary>
    /// Kullanıcının (eğitmen ya da öğrenci olarak) [start, end) aralığıyla çakışan eğitimi var mı?
    /// Aday satırlar SQL'de başlangıç saatine göre daraltılır, bitiş hesabı bellekte yapılır.
    /// </summary>
    public static async Task<bool> OverlapsAsync(
        AppDbContext db, LiveSettings live, Guid userId, DateTime start, DateTime end, Guid excludeId, CancellationToken ct)
    {
        var from = start.AddMinutes(-live.LessonMaxDurationMinutes);
        var candidates = await db.LiveSessions.AsNoTracking()
            .Where(x => x.Kind == LiveKind.Lesson && x.Id != excludeId
                && (x.HostId == userId || x.GuestId == userId)
                && (x.Status == LiveStatus.Listed || x.Status == LiveStatus.Booked
                    || x.Status == LiveStatus.Waiting || x.Status == LiveStatus.Live)
                && x.ScheduledAtUtc >= from && x.ScheduledAtUtc < end)
            .Select(x => new { x.ScheduledAtUtc, x.DurationMinutes })
            .ToListAsync(ct);

        return candidates.Any(c =>
            c.ScheduledAtUtc!.Value < end && c.ScheduledAtUtc.Value.AddMinutes(c.DurationMinutes!.Value) > start);
    }
}