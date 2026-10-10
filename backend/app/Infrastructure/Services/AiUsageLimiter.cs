using System.Collections.Concurrent;
using Dersakis.Shared;

namespace Dersakis.Infrastructure.Services;

/// <summary>
/// Kullanıcı başına günlük (Türkiye saati) mesaj hakkı. Bellekte tutulur: uygulama yeniden başlayınca sıfırlanır,
/// hackathon/geliştirme için yeterli. Kalıcı olması gerekirse tablo eklenir. Dakikalık sınır ayrıca "ai" rate limit politikasındadır.
/// </summary>
public sealed class AiUsageLimiter(TimeProvider clock)
{
    private readonly ConcurrentDictionary<Guid, (DateOnly Day, int Used)> _usage = new();

    /// <summary>Hak varsa 1 düşer ve true döner; remaining = bu istekten sonra kalan hak.</summary>
    public bool TryConsume(Guid userId, int limit, out int remaining)
    {
        var today = TurkeyClock.Today(clock);
        var allowed = false;
        var left = 0;

        _usage.AddOrUpdate(
            userId,
            _ =>
            {
                allowed = limit >= 1;
                left = allowed ? limit - 1 : 0;
                return (today, allowed ? 1 : 0);
            },
            (_, cur) =>
            {
                var used = cur.Day == today ? cur.Used : 0;
                if (used >= limit)
                {
                    allowed = false;
                    left = 0;
                    return (today, used);
                }
                allowed = true;
                left = limit - used - 1;
                return (today, used + 1);
            });

        remaining = left;
        return allowed;
    }

    /// <summary>Model çağrısı başarısız olduysa hak iade edilir.</summary>
    public void Refund(Guid userId)
    {
        var today = TurkeyClock.Today(clock);
        _usage.AddOrUpdate(
            userId,
            _ => (today, 0),
            (_, cur) => cur.Day == today && cur.Used > 0 ? (today, cur.Used - 1) : cur);
    }
}
