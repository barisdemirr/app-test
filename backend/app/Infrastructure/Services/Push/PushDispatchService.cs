using Dersakis.Domain.Entities;
using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Infrastructure.Services.Push;

public sealed class PushDispatchService(
    IServiceScopeFactory scopes, PushSettings cfg, TimeProvider clock, ILogger<PushDispatchService> log) : BackgroundService
{
    private DateTime _nextCleanupUtc = DateTime.MinValue;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var interval = TimeSpan.FromSeconds(cfg.DispatchIntervalSeconds);
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await DispatchOnceAsync(stoppingToken);
                await CleanupIfDueAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception ex) { log.LogError(ex, "Push gönderim turu başarısız oldu."); }

            try { await Task.Delay(interval, stoppingToken); }
            catch (OperationCanceledException) { break; }
        }
    }

    private async Task DispatchOnceAsync(CancellationToken ct)
    {
        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var now = clock.GetUtcNow().UtcDateTime;

        var due = await db.Notifications
            .Where(n => n.Delivery == PushDelivery.Pending && n.NextPushAtUtc <= now)
            .OrderBy(n => n.NextPushAtUtc)
            .Take(cfg.BatchSize)
            .ToListAsync(ct);
        if (due.Count == 0) return;

        var toSend = new List<Notification>();
        foreach (var n in due)
        {
            // Bayat bildirim gönderilmez (ör. 2 dakikalık pencere zaten kapandı).
            if (n.TtlSeconds is { } ttl && now > n.CreatedAtUtc.AddSeconds(ttl)) { n.Delivery = PushDelivery.Expired; continue; }
            if (!cfg.Enabled) { n.Delivery = PushDelivery.Skipped; continue; }
            toSend.Add(n);
        }

        if (toSend.Count > 0) await SendAsync(db, scope.ServiceProvider, toSend, now, ct);
        await db.SaveChangesAsync(ct);
    }

    private async Task SendAsync(AppDbContext db, IServiceProvider sp, List<Notification> items, DateTime now, CancellationToken ct)
    {
        var userIds = items.Select(n => n.UserId).Distinct().ToList();
        var devices = (await db.DeviceTokens.Where(t => userIds.Contains(t.UserId) && t.DisabledAtUtc == null).ToListAsync(ct))
            .ToLookup(t => t.UserId);
        var senders = sp.GetServices<IPushSender>().ToDictionary(s => s.Provider);

        // (bildirim, cihaz) çiftleri
        var jobs = new List<(Notification N, DeviceToken T)>();
        foreach (var n in items)
        {
            var mine = devices[n.UserId].ToList();
            if (mine.Count == 0) { n.Delivery = PushDelivery.Skipped; continue; }   // cihaz yok: bildirim kutusunda zaten var
            jobs.AddRange(mine.Select(d => (n, d)));
        }

        var results = new Dictionary<Notification, List<PushResult>>();
        foreach (var group in jobs.GroupBy(j => j.T.Provider))
        {
            var list = group.ToList();
            var messages = list.Select(j => new PushMessage(j.T.Token, j.N.Title, j.N.Body, j.N.DataJson, RemainingTtl(j.N, now))).ToList();
            IReadOnlyList<PushResult> res = senders.TryGetValue(group.Key, out var sender)
                ? await sender.SendAsync(messages, ct)
                : list.Select(_ => new PushResult(PushResultKind.Failed, "no_sender")).ToList();

            for (var i = 0; i < list.Count; i++)
            {
                var (n, token) = list[i];
                if (res[i].Kind == PushResultKind.InvalidToken) token.DisabledAtUtc = now;
                if (!results.TryGetValue(n, out var rs)) results[n] = rs = [];
                rs.Add(res[i]);
            }
        }

        foreach (var (n, rs) in results)
        {
            if (rs.Any(r => r.Kind == PushResultKind.Ok))
            {
                n.Delivery = PushDelivery.Sent; n.PushedAtUtc = now; n.LastError = null;
            }
            else if (rs.Any(r => r.Kind == PushResultKind.Retry))
            {
                n.PushAttempts++;
                n.LastError = Truncate(rs.First(r => r.Kind == PushResultKind.Retry).Error);
                if (n.PushAttempts >= cfg.MaxAttempts) n.Delivery = PushDelivery.Failed;
                else n.NextPushAtUtc = now.AddSeconds(Math.Min(300, 5 * Math.Pow(3, n.PushAttempts - 1)));  // 5, 15, 45, 135, 300 sn
            }
            else if (rs.All(r => r.Kind == PushResultKind.InvalidToken))
            {
                n.Delivery = PushDelivery.Skipped; n.LastError = "device_not_registered";
            }
            else
            {
                n.Delivery = PushDelivery.Failed; n.LastError = Truncate(rs[0].Error);
            }
        }
    }

    private static int? RemainingTtl(Notification n, DateTime now)
        => n.TtlSeconds is { } ttl ? Math.Max(1, (int)(n.CreatedAtUtc.AddSeconds(ttl) - now).TotalSeconds) : null;

    private static string? Truncate(string? value) => value is { Length: > 200 } ? value[..200] : value;

    private async Task CleanupIfDueAsync(CancellationToken ct)
    {
        var now = clock.GetUtcNow().UtcDateTime;
        if (now < _nextCleanupUtc) return;
        _nextCleanupUtc = now.AddHours(1);

        using var scope = scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var cutoff = now.AddDays(-cfg.RetentionDays);
        await db.Notifications.Where(n => n.CreatedAtUtc < cutoff && n.Delivery != PushDelivery.Pending).ExecuteDeleteAsync(ct);
        await db.DeviceTokens.Where(t => t.DisabledAtUtc != null && t.DisabledAtUtc < cutoff).ExecuteDeleteAsync(ct);
    }
}