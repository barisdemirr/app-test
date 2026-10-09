using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Infrastructure.Services;

public sealed class VideoDraftCleanupService(
    IServiceScopeFactory scopes, TimeProvider clock, ILogger<VideoDraftCleanupService> logger) : BackgroundService
{
    private static readonly TimeSpan Retention = TimeSpan.FromHours(24);
    private static readonly TimeSpan Interval = TimeSpan.FromHours(1);
    private const int BatchSize = 500;

    protected override async Task ExecuteAsync(CancellationToken stop)
    {
        while (!stop.IsCancellationRequested)
        {
            try
            {
                var deleted = await CleanAsync(stop);
                logger.LogInformation("Video taslak temizliği tamamlandı: {Count} taslak silindi.", deleted);
            }
            catch (OperationCanceledException) when (stop.IsCancellationRequested) { break; }
            catch (Exception ex) { logger.LogError(ex, "Video taslak temizliği başarısız oldu."); }

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

            var ids = await db.Videos
                .Where(v => v.Status == VideoStatus.Draft && v.CreatedAtUtc < cutoff)
                .OrderBy(v => v.CreatedAtUtc).Select(v => v.Id).Take(BatchSize)
                .ToListAsync(ct);
            if (ids.Count == 0) return total;

            // Status koşulu tekrar yazıldı: bu arada yayınlanan taslağa dokunma.
            total += await db.Videos.Where(v => ids.Contains(v.Id) && v.Status == VideoStatus.Draft).ExecuteDeleteAsync(ct);
            if (ids.Count < BatchSize) return total;
        }
    }
}