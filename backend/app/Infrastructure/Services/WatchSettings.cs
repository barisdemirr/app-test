namespace Dersakis.Infrastructure.Services;

public sealed class WatchSettings
{
    public int HeartbeatIntervalMs { get; init; } = 5000;   // istemciye söylenen heartbeat aralığı
    public double MinWatchRatio { get; init; } = 0.9;       // tamamlama için gereken doğrulanmış izleme oranı
    public int EndToleranceMs { get; init; } = 2000;        // son konum videonun bitişine bu kadar yakın olmalı
    public int SessionGraceMinutes { get; init; } = 15;     // oturum ömrü = süre x 3 + bu pay

    public WatchSettings EnsureValid()
    {
        if (HeartbeatIntervalMs is < 1000 or > 30_000) throw new InvalidOperationException("Watch:HeartbeatIntervalMs 1000-30000 arasında olmalı.");
        if (MinWatchRatio is < 0.5 or > 1.0) throw new InvalidOperationException("Watch:MinWatchRatio 0.5-1.0 arasında olmalı.");
        if (EndToleranceMs is < 0 or > 10_000) throw new InvalidOperationException("Watch:EndToleranceMs 0-10000 arasında olmalı.");
        if (SessionGraceMinutes is < 1 or > 120) throw new InvalidOperationException("Watch:SessionGraceMinutes 1-120 arasında olmalı.");
        return this;
    }
}