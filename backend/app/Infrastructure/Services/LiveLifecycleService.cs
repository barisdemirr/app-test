using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Live;

/// <summary>
/// Vakti gelmiş canlı oturumları (DueAtUtc) bulup işler. Her oturum KENDİ scope ve transaction'ında çalışır:
/// biri patlarsa diğerleri etkilenmez. Birden fazla örnek çalışsa bile çift işlem olmaz (koşullu UPDATE).
/// </summary>
public sealed class LiveLifecycleService(
    IServiceScopeFactory scopes, LiveSettings live, TimeProvider clock, ILogger<LiveLifecycleService> log) : BackgroundService
{
    private const int BatchSize = 50;
    private const int MaxBatchesPerTick = 10;

    protected override async Task ExecuteAsync(CancellationToken stop)
    {
        var interval = TimeSpan.FromSeconds(Math.Max(5, live.JobIntervalSeconds));
        while (!stop.IsCancellationRequested)
        {
            try { await RunTickAsync(stop); }
            catch (OperationCanceledException) when (stop.IsCancellationRequested) { return; }
            catch (Exception ex) { log.LogError(ex, "Live lifecycle tick failed"); }

            try { await Task.Delay(interval, stop); }
            catch (OperationCanceledException) { return; }
        }
    }

    private async Task RunTickAsync(CancellationToken stop)
    {
        for (var batch = 0; batch < MaxBatchesPerTick; batch++)
        {
            List<Guid> ids;
            using (var scope = scopes.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var now = clock.GetUtcNow().UtcDateTime;
                ids = await db.LiveSessions.AsNoTracking()
                    .Where(x => x.DueAtUtc != null && x.DueAtUtc <= now)
                    .OrderBy(x => x.DueAtUtc)
                    .Select(x => x.Id).Take(BatchSize).ToListAsync(stop);
            }
            if (ids.Count == 0) return;

            var progressed = 0;
            foreach (var id in ids)
            {
                try
                {
                    using var scope = scopes.CreateScope();
                    var sp = scope.ServiceProvider;
                    if (await LiveLifecycle.ProcessAsync(
                            sp.GetRequiredService<AppDbContext>(), sp.GetRequiredService<CreditService>(),
                            live, clock, id, stop))
                        progressed++;
                }
                catch (OperationCanceledException) when (stop.IsCancellationRequested) { throw; }
                catch (Exception ex) { log.LogError(ex, "Live session {SessionId} could not be processed", id); }
            }

            // Hiçbiri ilerlemediyse (ör. hepsi yeniden denenecekler) aynı satırlara boşuna dönme.
            if (progressed == 0 || ids.Count < BatchSize) return;
        }
    }
}