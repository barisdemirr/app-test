using System.Security.Claims;
using System.Text.RegularExpressions;
using Dersakis.Domain.Entities;
using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Notifications;

public sealed record RegisterDeviceRequest(string? Token, string? Platform, string? Provider);
public sealed record UnregisterDeviceRequest(string? Token);
public sealed record DeviceResponse(bool Registered, int ActiveDevices);

public sealed class DeviceEndpoints : IEndpoint
{
    private const int MaxActiveDevices = 10;
    private static readonly Regex ExpoToken =
        new(@"^Expo(nent)?PushToken\[[A-Za-z0-9_\-]{8,200}\]$", RegexOptions.Compiled | RegexOptions.CultureInvariant);

    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPut("/me/devices", Register).RequireAuthorization().RequireRateLimiting(RateLimitPolicies.Write).WithTags("Notifications");
        app.MapPost("/me/devices/unregister", Unregister).RequireAuthorization().RequireRateLimiting(RateLimitPolicies.Write).WithTags("Notifications");
        app.MapPost("/me/devices/test", SendTest).RequireAuthorization().RequireRateLimiting(RateLimitPolicies.Write).WithTags("Notifications");
    }

    /// <summary>Doğal olarak idempotent: aynı token tekrar gelirse yalnızca "son görülme" güncellenir.</summary>
    private static async Task<IResult> Register(
        RegisterDeviceRequest req, ClaimsPrincipal principal, AppDbContext db, TimeProvider clock, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        var token = (req.Token ?? "").Trim();
        var platform = (req.Platform ?? "").Trim().ToLowerInvariant();
        var provider = (req.Provider ?? "Expo").Trim();

        var error = new Validator()
            .Check(provider.Equals("Expo", StringComparison.OrdinalIgnoreCase), "Desteklenen bildirim sağlayıcısı: Expo.")
            .Check(ExpoToken.IsMatch(token), "Geçersiz Expo push token'ı.")
            .Check(platform is "ios" or "android", "platform 'ios' veya 'android' olmalı.")
            .ToError();
        if (error is not null) return Result.Failure(error).ToProblem();

        var now = clock.GetUtcNow().UtcDateTime;

        // Önce var olan kaydı güncelle: aynı telefon başka hesapla girerse token yeni hesaba geçer ve yeniden etkinleşir.
        Task<int> Touch() => db.DeviceTokens.Where(t => t.Token == token).ExecuteUpdateAsync(s => s
            .SetProperty(t => t.UserId, userId)
            .SetProperty(t => t.Platform, platform)
            .SetProperty(t => t.LastSeenAtUtc, now)
            .SetProperty(t => t.DisabledAtUtc, (DateTime?)null), ct);

        if (await Touch() == 0)
        {
            db.DeviceTokens.Add(new DeviceToken
            {
                Id = Guid.CreateVersion7(),
                CreatedAtUtc = now,
                UserId = userId,
                Token = token,
                Platform = platform,
                Provider = PushProvider.Expo,
                LastSeenAtUtc = now
            });
            try
            {
                await db.SaveChangesAsync(ct);
            }
            catch (DbUpdateException ex) when (ex.IsUniqueViolation("UX_DeviceTokens_Token"))
            {
                // Paralel bir istek aynı token'ı az önce ekledi: o kaydı güncelle.
                db.ChangeTracker.Clear();
                await Touch();
            }
        }

        // Bir hesapta en fazla MaxActiveDevices aktif cihaz: en eski görülenler kapatılır.
        var stale = await db.DeviceTokens.AsNoTracking()
            .Where(t => t.UserId == userId && t.DisabledAtUtc == null)
            .OrderByDescending(t => t.LastSeenAtUtc)
            .Skip(MaxActiveDevices).Select(t => t.Id).ToListAsync(ct);
        if (stale.Count > 0)
            await db.DeviceTokens.Where(t => stale.Contains(t.Id))
                .ExecuteUpdateAsync(s => s.SetProperty(t => t.DisabledAtUtc, (DateTime?)now), ct);

        var active = await db.DeviceTokens.CountAsync(t => t.UserId == userId && t.DisabledAtUtc == null, ct);
        return Results.Ok(new DeviceResponse(true, active));
    }

    /// <summary>Çıkış yaparken çağrılır: bu telefon, çıkış yapan hesabın bildirimlerini almasın.</summary>
    private static async Task<IResult> Unregister(
        UnregisterDeviceRequest req, ClaimsPrincipal principal, AppDbContext db, TimeProvider clock, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        var token = (req.Token ?? "").Trim();
        if (token.Length is 0 or > 255)
            return Result.Failure(Error.Validation("validation_failed", "Geçersiz token.")).ToProblem();

        var now = clock.GetUtcNow().UtcDateTime;
        await db.DeviceTokens.Where(t => t.Token == token && t.UserId == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.DisabledAtUtc, (DateTime?)now), ct);

        var active = await db.DeviceTokens.CountAsync(t => t.UserId == userId && t.DisabledAtUtc == null, ct);
        return Results.Ok(new DeviceResponse(false, active));
    }

    /// <summary>Yalnızca geliştirmede: kendine test bildirimi gönderir. RN kurulumunu doğrulamak içindir.</summary>
    private static async Task<IResult> SendTest(
        ClaimsPrincipal principal, AppDbContext db, IHostEnvironment env, TimeProvider clock, CancellationToken ct)
    {
        if (!env.IsDevelopment())
            return Result.Failure(Error.NotFound("not_found", "Bulunamadı.")).ToProblem();
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        NotificationOutbox.Enqueue(db, userId, NotificationType.Test, "Test bildirimi",
            "Dersakış bildirimleri çalışıyor.", new { kind = "test" }, clock.GetUtcNow().UtcDateTime, ttlSeconds: 60);
        await db.SaveChangesAsync(ct);
        return Results.Ok(new { queued = true });
    }
}