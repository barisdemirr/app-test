using Dersakis.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Infrastructure.Services;

public sealed class QaAutoAwardService(
    IServiceScopeFactory scopes, QaSettings cfg, TimeProvider clock, ILogger<QaAutoAwardService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(10);
    private const int BatchSize = 100;

    protected override async Task ExecuteAsync(CancellationToken stop)
    {
        while (!stop.IsCancellationRequested)
        {
            try
            {
                var paid = await RunOnceAsync(stop);
                if (paid > 0) logger.LogInformation("Otomatik ödül: {Count} soru ilk cevaplayana ödendi.", paid);
            }
            catch (OperationCanceledException) when (stop.IsCancellationRequested) { break; }
            catch (Exception ex) { logger.LogError(ex, "Otomatik ödül turu başarısız oldu."); }

            try { await Task.Delay(Interval, stop); }
            catch (OperationCanceledException) { break; }
        }
    }

    private async Task<int> RunOnceAsync(CancellationToken ct)
    {
        var cutoff = clock.GetUtcNow().UtcDateTime.AddDays(-cfg.BestAnswerWindowDays);
        var paid = 0;

        while (!ct.IsCancellationRequested)
        {
            List<Guid> ids;
            using (var scope = scopes.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                ids = await db.QaQuestions.AsNoTracking()
                    .Where(q => q.BestAnswerId == null && q.FirstAnswerAtUtc != null && q.FirstAnswerAtUtc <= cutoff)
                    .OrderBy(q => q.FirstAnswerAtUtc).Select(q => q.Id).Take(BatchSize).ToListAsync(ct);
            }
            if (ids.Count == 0) break;

            var progressed = 0;
            foreach (var id in ids)
            {
                try
                {
                    using var scope = scopes.CreateScope();
                    var awards = scope.ServiceProvider.GetRequiredService<QaAwardService>();
                    var r = await awards.AutoAwardAsync(id, ct);
                    if (r.IsSuccess) { paid++; progressed++; }
                    else if (r.Error!.Code == "not_due") progressed++; // bu arada soran seçmiş olabilir, geçilir
                }
                catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
                catch (Exception ex) { logger.LogError(ex, "Otomatik ödül başarısız: {QuestionId}", id); }
            }

            // Hiçbiri ilerlemediyse (hepsi hata) aynı kayıtlara sonsuz dönmemek için bu turu bitir.
            if (progressed == 0 || ids.Count < BatchSize) break;
        }

        return paid;
    }
}