using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Profile;

public sealed record AvatarResponse(string? AvatarUrl);

public sealed class AvatarEndpoints : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPut("/me/avatar", Upload).RequireAuthorization()
           .RequireRateLimiting(RateLimitPolicies.Upload).WithTags("Profile");

        app.MapDelete("/me/avatar", Remove).RequireAuthorization()
           .RequireRateLimiting(RateLimitPolicies.Write).WithTags("Profile");

        // Anonim: <img> etiketi Authorization header gönderemez. Tahmin edilemez kullanıcı GUID'i ile erişilir.
        app.MapGet("/users/{id:guid}/avatar", Get).AllowAnonymous().WithTags("Profile");
    }

    private static async Task<IResult> Upload(
        HttpContext http, AppDbContext db, CreditService accountLock, AvatarStorage storage,
        ProfileSettings cfg, TimeProvider clock, CancellationToken ct)
    {
        if (http.User.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        var request = http.Request;
        var type = (request.ContentType ?? "").Split(';')[0].Trim().ToLowerInvariant();
        if (type is not ("image/jpeg" or "image/png" or "image/webp"))
            return Results.Problem(statusCode: 415, title: "unsupported_media_type", detail: "Content-Type image/jpeg, image/png veya image/webp olmalı.");

        if (request.ContentLength is { } declared && declared > cfg.AvatarMaxBytes) return TooLarge(cfg);

        // Kestrel'in gövde sınırını bu istek için bizim sınırımıza indir.
        var limit = http.Features.Get<IHttpMaxRequestBodySizeFeature>();
        if (limit is { IsReadOnly: false }) limit.MaxRequestBodySize = cfg.AvatarMaxBytes;

        using var buffer = new MemoryStream();
        try
        {
            await request.Body.CopyToAsync(buffer, ct);
        }
        catch (BadHttpRequestException e) when (e.StatusCode == StatusCodes.Status413PayloadTooLarge)
        {
            return TooLarge(cfg);
        }
        catch (BadHttpRequestException)
        {
            return Invalid("Yükleme tamamlanamadı (bağlantı kesildi veya gövde bozuk). Tekrar dene.");
        }

        if (buffer.Length == 0) return Invalid("Dosya boş.");
        if (buffer.Length > cfg.AvatarMaxBytes) return TooLarge(cfg);

        buffer.Position = 0;
        var webp = AvatarProcessor.TryProcess(buffer);
        if (webp is null)
            return Invalid("Geçerli bir JPEG, PNG veya WebP görsel yükle (en fazla 16 megapiksel).");

        var now = clock.GetUtcNow().UtcDateTime;
        var (relative, full) = storage.NewPath(userId);
        var committed = false;

        try
        {
            await File.WriteAllBytesAsync(full, webp, ct);

            var (found, old) = await db.RunInTransactionAsync<(bool Found, string? Old)>(async token =>
            {
                // Aynı kullanıcının paralel avatar işlemleri sıraya girer.
                if (!await accountLock.LockAccountAsync(userId, token)) return (false, null);

                var previous = await db.Users.AsNoTracking().Where(u => u.Id == userId).Select(u => u.AvatarPath).FirstAsync(token);
                await db.Users.Where(u => u.Id == userId).ExecuteUpdateAsync(s => s
                    .SetProperty(u => u.AvatarPath, relative)
                    .SetProperty(u => u.AvatarUpdatedAtUtc, (DateTime?)now), token);
                return (true, previous);
            }, CancellationToken.None);

            if (!found)
                return Result.Failure(Error.Unauthorized("user_not_found", "Hesap bulunamadı.")).ToProblem();

            committed = true;
            if (old is not null && storage.Resolve(old) is { } oldFull) storage.TryDelete(oldFull);

            return Results.Ok(new AvatarResponse(AvatarUrls.For(userId, now)));
        }
        finally
        {
            if (!committed) storage.TryDelete(full); // hata, iptal, kopma: yetim dosya kalmaz
        }
    }

    private static async Task<IResult> Remove(
        HttpContext http, AppDbContext db, CreditService accountLock, AvatarStorage storage, CancellationToken ct)
    {
        if (http.User.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        var (found, old) = await db.RunInTransactionAsync<(bool Found, string? Old)>(async token =>
        {
            if (!await accountLock.LockAccountAsync(userId, token)) return (false, null);

            var previous = await db.Users.AsNoTracking().Where(u => u.Id == userId).Select(u => u.AvatarPath).FirstAsync(token);
            await db.Users.Where(u => u.Id == userId).ExecuteUpdateAsync(s => s
                .SetProperty(u => u.AvatarPath, (string?)null)
                .SetProperty(u => u.AvatarUpdatedAtUtc, (DateTime?)null), token);
            return (true, previous);
        }, CancellationToken.None);

        if (!found)
            return Result.Failure(Error.Unauthorized("user_not_found", "Hesap bulunamadı.")).ToProblem();

        if (old is not null && storage.Resolve(old) is { } oldFull) storage.TryDelete(oldFull);
        return Results.Ok(new AvatarResponse(null));
    }

    private static async Task<IResult> Get(Guid id, HttpContext http, AppDbContext db, AvatarStorage storage, CancellationToken ct)
    {
        var path = await db.Users.AsNoTracking().Where(u => u.Id == id).Select(u => u.AvatarPath).FirstOrDefaultAsync(ct);
        var full = path is null ? null : storage.Resolve(path);
        if (full is null || !File.Exists(full))
            return Result.Failure(Error.NotFound("avatar_not_found", "Avatar bulunamadı.")).ToProblem();

        // Adres ?v= ile değiştiği için kısa önbellek yeterli, eski görsel uzun süre kalmaz.
        http.Response.Headers.CacheControl = "public, max-age=3600";
        http.Response.Headers.XContentTypeOptions = "nosniff";
        return Results.File(full, "image/webp");
    }

    private static IResult Invalid(string message)
        => Result.Failure(Error.Validation("invalid_image", message)).ToProblem();

    private static IResult TooLarge(ProfileSettings cfg)
        => Results.Problem(statusCode: 413, title: "payload_too_large", detail: $"Görsel en fazla {cfg.AvatarMaxBytes / (1024 * 1024)} MB olabilir.");
}