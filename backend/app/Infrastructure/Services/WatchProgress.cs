using Dersakis.Domain.Entities;

namespace Dersakis.Infrastructure.Services;

public static class WatchProgress
{
    /// <summary>
    /// Heartbeat'i oturuma uygular. Kredi = min(konumun ileri gittiği miktar, sunucu saatiyle geçen süre).
    /// İleri sarma, geçen süreden fazla kredi getirmez. Geriye gitmek kredi vermez, sadece konumu günceller.
    /// </summary>
    public static void Apply(WatchSession s, int positionMs, DateTime now)
    {
        var pos = Math.Clamp(positionMs, 0, s.VideoDurationMs);
        var elapsedMs = (int)Math.Clamp((now - s.LastHeartbeatAtUtc).TotalMilliseconds, 0, int.MaxValue);

        if (pos > s.LastPositionMs)
        {
            var credit = Math.Min(pos - s.LastPositionMs, elapsedMs);
            s.WatchedMs = Math.Min(s.WatchedMs + credit, s.VideoDurationMs); // süreyi aşamaz (DB constraint ile uyumlu)
        }

        s.LastPositionMs = pos;
        s.LastHeartbeatAtUtc = now;
    }

    public static bool IsComplete(WatchSession s, WatchSettings cfg, out int requiredMs)
    {
        requiredMs = (int)Math.Ceiling(s.VideoDurationMs * cfg.MinWatchRatio);
        return s.WatchedMs >= requiredMs && s.LastPositionMs >= s.VideoDurationMs - cfg.EndToleranceMs;
    }

    /// <summary>Ömür: video süresinin 3 katı + pay. Duraklatmaya yeter, terk edilmiş oturumu sınırlar.</summary>
    public static bool IsExpired(WatchSession s, DateTime now, WatchSettings cfg)
        => now - s.CreatedAtUtc > TimeSpan.FromMilliseconds(s.VideoDurationMs * 3L) + TimeSpan.FromMinutes(cfg.SessionGraceMinutes);
}