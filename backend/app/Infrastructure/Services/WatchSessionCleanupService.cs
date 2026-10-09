using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Infrastructure.Services;

public sealed class WatchSessionCleanupService(
    IServiceScopeFactory scopes, TimeProvider clock, ILogger<WatchSessionCleanupService> logger) : BackgroundService
{
    private static readonly TimeSpan Retention = TimeSpan.FromHours(24);
    private static readonly TimeSpan Interval = TimeSpan.FromHours(1);
    private const int BatchSize = 1000;

    protected override async Task ExecuteAsync(CancellationToken stop)
    {
        while (!stop.IsCancellationRequested)
        {
            try
            {
                var deleted = await CleanAsync(stop);
                logger.LogInformation("İzleme oturumu temizliği tamamlandı: {Count} oturum silindi.", deleted);
            }
            catch (OperationCanceledException) when (stop.IsCancellationRequested) { break; }
            catch (Exception ex) { logger.LogError(ex, "İzleme oturumu temizliği başarısız oldu."); }

            try { await Task.Delay(Interval, stop); }
            catch (OperationCanceledException) { break; }
        }
    }

    private async Task<int> CleanAsync(CancellationToken ct)
    {
        var cutoff = clock.GetUtcNow().UtcDateTime - Retention;
        var total = 0;

        while (true)
        {
            using var scope = scopes.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var ids = await db.WatchSessions
                .Where(w => w.Status != WatchStatus.Completed && w.CreatedAtUtc < cutoff)
                .OrderBy(w => w.CreatedAtUtc).Select(w => w.Id).Take(BatchSize)
                .ToListAsync(ct);
            if (ids.Count == 0) return total;

            // Status koşulu tekrar: bu arada tamamlanan oturuma dokunma.
            total += await db.WatchSessions
                .Where(w => ids.Contains(w.Id) && w.Status != WatchStatus.Completed).ExecuteDeleteAsync(ct);
            if (ids.Count < BatchSize) return total;
        }
    }
}