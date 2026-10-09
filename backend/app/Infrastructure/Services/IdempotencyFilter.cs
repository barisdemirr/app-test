using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Dersakis.Domain.Entities;
using Dersakis.Infrastructure.Database;
using Dersakis.Shared;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Infrastructure.Services;

public sealed partial class IdempotencyFilter(AppDbContext db, TimeProvider clock) : IEndpointFilter
{
    public const int MaxBodyBytes = 64 * 1024;

    [GeneratedRegex("^[A-Za-z0-9_-]{16,64}$")]
    private static partial Regex KeyFormat();

    private enum Kind { Completed, Passthrough, Duplicate, InProgress }
    private sealed record Outcome(Kind Kind, StoredResult? Response = null);

    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext invocation, EndpointFilterDelegate next)
    {
        var http = invocation.HttpContext;
        var ct = http.RequestAborted;

        if (http.User.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        var key = http.Request.Headers["Idempotency-Key"].ToString();
        if (!KeyFormat().IsMatch(key))
            return Result.Failure(Error.Validation("idempotency_key_invalid",
                "Idempotency-Key header'ı zorunlu: 16-64 karakter, harf, rakam, '-' veya '_' (önerilen: GUID).")).ToProblem();

        var hash = await ComputeHashAsync(http.Request, ct);

        // Hızlı yol: daha önce tamamlanmışsa transaction açmadan cevapla.
        var existing = await FindAsync(userId, key, ct);
        if (existing is not null) return Replay(existing, hash);

        var id = Guid.CreateVersion7();
        var strategy = db.Database.CreateExecutionStrategy();
        var outcome = await strategy.ExecuteAsync(token => RunAsync(invocation, next, id, userId, key, hash, token), ct);

        if (outcome.Response is not null) return outcome.Response;

        if (outcome.Kind == Kind.Duplicate)
        {
            // Yarışı kaybettik: kazanan commit etti, onun cevabını aynen dön.
            existing = await FindAsync(userId, key, ct);
            if (existing is not null) return Replay(existing, hash);
        }

        http.Response.Headers.RetryAfter = "2";
        return Result.Failure(Error.Conflict("request_in_progress",
            "Aynı Idempotency-Key ile bir istek hâlâ işleniyor. Kısa süre sonra tekrar dene.")).ToProblem();
    }

    private async Task<Outcome> RunAsync(EndpointFilterInvocationContext invocation, EndpointFilterDelegate next,
        Guid id, Guid userId, string key, byte[] hash, CancellationToken ct)
    {
        var http = invocation.HttpContext;
        db.ChangeTracker.Clear(); // yeniden deneme olursa temiz başla
        await using var tx = await db.Database.BeginTransactionAsync(ct);

        try
        {
            // Aynı anahtarı tutan başka bir transaction varsa en fazla 5 sn bekle.
            await db.Database.ExecuteSqlRawAsync("SET LOCK_TIMEOUT 5000;", ct);
            await db.Database.ExecuteSqlInterpolatedAsync($@"
                INSERT INTO IdempotencyKeys (Id, UserId, [Key], RequestHash, StatusCode, CreatedAtUtc)
                VALUES ({id}, {userId}, {key}, {hash}, 0, {clock.GetUtcNow().UtcDateTime})", ct);
            await db.Database.ExecuteSqlRawAsync("SET LOCK_TIMEOUT -1;", ct);
        }
        catch (SqlException e) when (e.Number is 2601 or 2627) // unique ihlali: aynı anahtar zaten tamamlanmış
        {
            await ResetLockTimeoutAsync();
            return new Outcome(Kind.Duplicate);
        }
        catch (SqlException e) when (e.Number == 1222)          // kilit bekleme süresi doldu
        {
            await ResetLockTimeoutAsync();
            return new Outcome(Kind.InProgress);
        }

        // İş, bu transaction'ın içinde çalışır (handler aynı scoped DbContext'i kullanır).
        var stored = await CaptureAsync(http, await next(invocation));

        // 2xx değilse: dispose sırasında rollback olur, yan etki kalmaz ve anahtar tüketilmez.
        if (stored.Status is < 200 or >= 300)
            return new Outcome(Kind.Passthrough, stored);

        // Commit aşamasında istemci kopsa bile yarım kalmasın diye CancellationToken.None.
        await db.IdempotencyKeys.Where(k => k.Id == id).ExecuteUpdateAsync(s => s
            .SetProperty(k => k.StatusCode, stored.Status)
            .SetProperty(k => k.ContentType, stored.ContentType)
            .SetProperty(k => k.ResponseBody, stored.Body), CancellationToken.None);
        await tx.CommitAsync(CancellationToken.None);

        return new Outcome(Kind.Completed, stored);
    }

    private async Task ResetLockTimeoutAsync()
    {
        try { await db.Database.ExecuteSqlRawAsync("SET LOCK_TIMEOUT -1;", CancellationToken.None); }
        catch { /* bağlantı havuza dönerken zaten sıfırlanır, kritik değil */ }
    }

    /// <summary>Handler'ın IResult'unu bir buffer'a çalıştırıp durum kodu, içerik tipi ve gövdeyi yakalar.</summary>
    private static async Task<StoredResult> CaptureAsync(HttpContext http, object? result)
    {
        var response = http.Response;
        var original = response.Body;
        await using var buffer = new MemoryStream();

        response.Body = buffer;
        response.StatusCode = StatusCodes.Status200OK;
        response.ContentType = null;
        response.ContentLength = null;
        try
        {
            var r = result as IResult ?? (result is null ? Results.NoContent() : Results.Json(result));
            await r.ExecuteAsync(http);
        }
        finally
        {
            response.Body = original;
        }

        return new StoredResult(response.StatusCode, response.ContentType, buffer.ToArray());
    }

    private static IResult Replay(IdempotencyKey existing, byte[] hash)
    {
        if (!existing.RequestHash.AsSpan().SequenceEqual(hash))
            return Results.Problem(statusCode: 422, title: "idempotency_key_reused",
                detail: "Bu Idempotency-Key farklı bir istek için daha önce kullanılmış. Yeni istek için yeni anahtar üret.");

        if (existing.StatusCode == 0) // normalde commit edilmiş satır tamamlanmış olur, savunma amaçlı
            return Result.Failure(Error.Conflict("request_in_progress", "İstek hâlâ işleniyor.")).ToProblem();

        return new StoredResult(existing.StatusCode, existing.ContentType, existing.ResponseBody ?? [], replayed: true);
    }

    private Task<IdempotencyKey?> FindAsync(Guid userId, string key, CancellationToken ct)
        => db.IdempotencyKeys.AsNoTracking().FirstOrDefaultAsync(k => k.UserId == userId && k.Key == key, ct);

    private static async Task<byte[]> ComputeHashAsync(HttpRequest req, CancellationToken ct)
    {
        using var sha = IncrementalHash.CreateHash(HashAlgorithmName.SHA256);
        sha.AppendData(Encoding.UTF8.GetBytes($"{req.Method}\n{req.Path}{req.QueryString}\n"));

        if (req.Body.CanSeek)
        {
            req.Body.Position = 0;
            using var ms = new MemoryStream();
            await req.Body.CopyToAsync(ms, ct);
            sha.AppendData(ms.GetBuffer().AsSpan(0, (int)ms.Length));
            req.Body.Position = 0;
        }

        return sha.GetHashAndReset();
    }
}

internal sealed class StoredResult(int status, string? contentType, byte[] body, bool replayed = false) : IResult
{
    public int Status => status;
    public string? ContentType => contentType;
    public byte[] Body => body;

    public async Task ExecuteAsync(HttpContext http)
    {
        http.Response.StatusCode = status;
        if (replayed) http.Response.Headers["Idempotent-Replayed"] = "true";
        if (contentType is not null) http.Response.ContentType = contentType;
        http.Response.ContentLength = body.Length;
        if (body.Length > 0) await http.Response.Body.WriteAsync(body, http.RequestAborted);
    }
}