using System.Security.Cryptography;
using System.Text;
using Dersakis.Domain.Entities;
using Dersakis.Infrastructure.Database;
using Dersakis.Shared;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Infrastructure.Services;

public sealed record IssuedCode(Guid Id, string Code);

public sealed class OtpService(AppDbContext db, OtpSettings cfg, JwtSettings jwt, TimeProvider clock)
{
    /// <summary>Yeni kod üretir (SMS gönderimi çağırana ait). Limitler aşıldıysa 429.</summary>
    public async Task<Result<IssuedCode>> IssueAsync(string phone, CancellationToken ct)
    {
        var now = clock.GetUtcNow().UtcDateTime;

        var last = await db.PhoneVerifications.AsNoTracking().Where(x => x.Phone == phone)
            .OrderByDescending(x => x.CreatedAtUtc).Select(x => (DateTime?)x.CreatedAtUtc).FirstOrDefaultAsync(ct);
        if (last is { } l && now - l < TimeSpan.FromSeconds(cfg.ResendSeconds))
        {
            var wait = (int)Math.Ceiling((TimeSpan.FromSeconds(cfg.ResendSeconds) - (now - l)).TotalSeconds);
            return Error.TooMany("code_too_soon", $"Yeni kod için {wait} saniye bekle.");
        }

        var lastHour = await db.PhoneVerifications.CountAsync(x => x.Phone == phone && x.CreatedAtUtc >= now.AddHours(-1), ct);
        if (lastHour >= cfg.MaxPerHour)
            return Error.TooMany("code_limit_reached", "Bu numara için saatlik kod limiti doldu. Daha sonra tekrar dene.");

        var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        var row = new PhoneVerification
        {
            Phone = phone,
            CodeHash = Hash(phone, code),
            CreatedAtUtc = now,
            ExpiresAtUtc = now.AddSeconds(cfg.CodeTtlSeconds)
        };

        try
        {
            await db.RunInTransactionAsync<int>(async token =>
            {
                // Eski aktif kodu iptal et, yenisini ekle: aynı transaction'da.
                await db.PhoneVerifications.Where(x => x.Phone == phone && x.ConsumedAtUtc == null)
                    .ExecuteUpdateAsync(s => s.SetProperty(x => x.ConsumedAtUtc, (DateTime?)now), token);
                db.PhoneVerifications.Add(row);
                await db.SaveChangesAsync(token);
                return 0;
            }, ct);
        }
        catch (DbUpdateException ex) when (ex.IsUniqueViolation("UX_PhoneVerifications_ActivePerPhone"))
        {
            return Error.TooMany("code_too_soon", "Bir kod zaten gönderiliyor. Birkaç saniye sonra tekrar dene.");
        }

        return new IssuedCode(row.Id, code);
    }

    /// <summary>SMS gönderilemediyse kodu iptal eder ki kullanıcı beklemeden yeniden isteyebilsin.</summary>
    public Task CancelAsync(Guid verificationId)
        => db.PhoneVerifications.Where(x => x.Id == verificationId)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.ConsumedAtUtc, (DateTime?)clock.GetUtcNow().UtcDateTime), CancellationToken.None);

    /// <summary>
    /// Kodu doğrular, TÜKETMEZ (tüketme kayıt transaction'ında). Deneme sayacı atomik artar ve geri alınmaz.
    /// Başarılıysa doğrulama kaydının id'sini döner.
    /// </summary>
    public async Task<Result<Guid>> VerifyAsync(string phone, string code, CancellationToken ct)
    {
        var now = clock.GetUtcNow().UtcDateTime;
        var v = await db.PhoneVerifications.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Phone == phone && x.ConsumedAtUtc == null, ct);

        if (v is null) return Error.Validation("code_invalid", "Doğrulama kodu hatalı veya geçersiz. Yeni kod iste.");
        if (v.ExpiresAtUtc <= now) return Error.Validation("code_expired", "Doğrulama kodunun süresi doldu. Yeni kod iste.");

        // Atomik sayaç: paralel denemeler de sınırı aşamaz. CancellationToken.None: bağlantıyı keserek sayaç atlatılamaz.
        var rows = await db.PhoneVerifications
            .Where(x => x.Id == v.Id && x.ConsumedAtUtc == null && x.Attempts < cfg.MaxAttempts)
            .ExecuteUpdateAsync(s => s.SetProperty(x => x.Attempts, x => x.Attempts + 1), CancellationToken.None);
        if (rows == 0) return Error.TooMany("code_attempts_exceeded", "Çok fazla hatalı deneme. Yeni kod iste.");

        if (!CryptographicOperations.FixedTimeEquals(Hash(phone, code), v.CodeHash))
            return Error.Validation("code_invalid", "Doğrulama kodu hatalı.");

        return v.Id;
    }

    private byte[] Hash(string phone, string code)
        => HMACSHA256.HashData(Encoding.UTF8.GetBytes(jwt.Key), Encoding.UTF8.GetBytes($"otp-v1:{phone}:{code}"));
}