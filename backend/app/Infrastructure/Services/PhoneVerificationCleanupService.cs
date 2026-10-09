using Dersakis.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Infrastructure.Services;

public sealed class PhoneVerificationCleanupService(
    IServiceScopeFactory scopes, TimeProvider clock, ILogger<PhoneVerificationCleanupService> logger) : BackgroundService
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
                var total = 0;
                var cutoff = clock.GetUtcNow().UtcDateTime - Retention;
                while (true)
                {
                    using var scope = scopes.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    var ids = await db.PhoneVerifications.Where(x => x.CreatedAtUtc < cutoff)
                        .OrderBy(x => x.CreatedAtUtc).Select(x => x.Id).Take(BatchSize).ToListAsync(stop);
                    if (ids.Count == 0) break;
                    total += await db.PhoneVerifications.Where(x => ids.Contains(x.Id)).ExecuteDeleteAsync(stop);
                    if (ids.Count < BatchSize) break;
                }
                logger.LogInformation("Doğrulama kodu temizliği tamamlandı: {Count} kayıt silindi.", total);
            }
            catch (OperationCanceledException) when (stop.IsCancellationRequested) { break; }
            catch (Exception ex) { logger.LogError(ex, "Doğrulama kodu temizliği başarısız oldu."); }

            try { await Task.Delay(Interval, stop); }
            catch (OperationCanceledException) { break; }
        }
    }
}