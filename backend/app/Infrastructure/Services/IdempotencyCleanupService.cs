using Dersakis.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Infrastructure.Services;

public sealed class IdempotencyCleanupService(
    IServiceScopeFactory scopes, TimeProvider clock, ILogger<IdempotencyCleanupService> logger) : BackgroundService
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
                logger.LogInformation("Idempotency temizliği tamamlandı: {Count} kayıt silindi.", deleted);
            }
            catch (OperationCanceledException) when (stop.IsCancellationRequested) { break; }
            catch (Exception ex)
            {
                // Servis hata verip uygulamayı düşürmesin, bir sonraki turda tekrar dener.
                logger.LogError(ex, "Idempotency temizliği başarısız oldu.");
            }

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

            var ids = await db.IdempotencyKeys
                .Where(k => k.CreatedAtUtc < cutoff)
                .OrderBy(k => k.CreatedAtUtc)
                .Select(k => k.Id)
                .Take(BatchSize)
                .ToListAsync(ct);
            if (ids.Count == 0) return total;

            total += await db.IdempotencyKeys.Where(k => ids.Contains(k.Id)).ExecuteDeleteAsync(ct);
            if (ids.Count < BatchSize) return total;
        }
    }
}