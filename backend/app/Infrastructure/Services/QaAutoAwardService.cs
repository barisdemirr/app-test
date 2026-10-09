using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Dersakis.Shared;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Infrastructure.Services;

/// <summary>Süresi dolan sorular için otomatik ödül (ilk cevaplayana) ve cevapsız sorular için iade.</summary>
public sealed class QaAutoAwardService(
    IServiceScopeFactory scopes, QaSettings cfg, TimeProvider clock, ILogger<QaAutoAwardService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(10);
    private const int BatchSize = 100;
    private const int MaxRounds = 50;

    protected override async Task ExecuteAsync(CancellationToken stop)
    {
        while (!stop.IsCancellationRequested)
        {
            try
            {
                var now = clock.GetUtcNow().UtcDateTime;
                var awardCutoff = now.AddDays(-cfg.BestAnswerWindowDays);
                var refundCutoff = now.AddDays(-cfg.NoAnswerRefundDays);

                var awarded = await ProcessAsync(
                    db => db.QaQuestions.AsNoTracking()
                        .Where(q => q.BestAnswerId == null && q.FirstAnswerAtUtc != null && q.FirstAnswerAtUtc <= awardCutoff)
                        .OrderBy(q => q.FirstAnswerAtUtc).Select(q => q.Id).Take(BatchSize).ToListAsync(stop),
                    async (sp, id) => await sp.GetRequiredService<QaAwardService>().AutoAwardAsync(id, stop),
                    stop);

                var refunded = await ProcessAsync(
                    db => db.QaQuestions.AsNoTracking()
                        .Where(q => q.Mode == QaMode.Text && q.AnswerCount == 0 && q.RefundedAtUtc == null && q.CreatedAtUtc <= refundCutoff)
                        .OrderBy(q => q.CreatedAtUtc).Select(q => q.Id).Take(BatchSize).ToListAsync(stop),
                    async (sp, id) => await sp.GetRequiredService<QaRefundService>().RefundAsync(id, stop),
                    stop);

                if (awarded + refunded > 0)
                    logger.LogInformation("Bilene sor işlemleri: {Awarded} otomatik ödül, {Refunded} iade.", awarded, refunded);
            }
            catch (OperationCanceledException) when (stop.IsCancellationRequested) { break; }
            catch (Exception ex) { logger.LogError(ex, "Bilene sor arka plan turu başarısız oldu."); }

            try { await Task.Delay(Interval, stop); }
            catch (OperationCanceledException) { break; }
        }
    }

    /// <summary>Her soru kendi transaction'ında işlenir, biri hata verse diğerleri etkilenmez.</summary>
    private async Task<int> ProcessAsync(
        Func<AppDbContext, Task<List<Guid>>> find, Func<IServiceProvider, Guid, Task<Result>> handle, CancellationToken ct)
    {
        var done = 0;

        for (var round = 0; round < MaxRounds && !ct.IsCancellationRequested; round++)
        {
            List<Guid> ids;
            using (var scope = scopes.CreateScope())
                ids = await find(scope.ServiceProvider.GetRequiredService<AppDbContext>());
            if (ids.Count == 0) break;

            var progressed = 0;
            foreach (var id in ids)
            {
                try
                {
                    using var scope = scopes.CreateScope();
                    var r = await handle(scope.ServiceProvider, id);
                    if (r.IsSuccess) { done++; progressed++; }
                    else if (r.Error!.Code == "not_due") progressed++; // bu arada durumu değişmiş, geçilir
                }
                catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
                catch (Exception ex) { logger.LogError(ex, "Bilene sor işlemi başarısız: {QuestionId}", id); }
            }

            if (progressed == 0 || ids.Count < BatchSize) break; // hepsi hata verdiyse aynı kayıtlarda dönme
        }

        return done;
    }
}