using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Auth;

public sealed record LoginRequest(string? Phone, string? Password);

public sealed class Login : IEndpoint
{
    private const int MaxFailedAttempts = 5;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapPost("/auth/login", Handle).AllowAnonymous()
              .RequireRateLimiting(RateLimitPolicies.Auth).WithTags("Auth");

    private static async Task<IResult> Handle(
        LoginRequest req, AppDbContext db, PasswordService passwords, TokenService tokens,
        TimeProvider clock, CancellationToken ct)
    {
        var phone = PhoneNumber.Normalize(req.Phone);
        var password = req.Password ?? "";

        if (phone is null || password.Length is 0 or > 128)
            return Invalid();

        var now = clock.GetUtcNow().UtcDateTime;
        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Phone == phone, ct);

        if (user?.LockoutEndUtc > now)
            return Result.Failure(Error.TooMany("account_locked",
                "Çok fazla hatalı deneme. Bir süre sonra tekrar dene.")).ToProblem();

        // user null olsa bile doğrulama yapılır (zamanlama farkı oluşmasın).
        var verdict = passwords.Verify(user?.PasswordHash, password);

        if (user is null || verdict == PasswordVerificationResult.Failed)
        {
            if (user is not null) await RegisterFailure(db, user.Id, now);
            return Invalid();
        }

        // Başarılı giriş: sadece gerekiyorsa yaz (her girişte gereksiz UPDATE yok).
        if (user.FailedLoginCount > 0 || user.LockoutEndUtc is not null)
        {
            await db.Users.Where(u => u.Id == user.Id).ExecuteUpdateAsync(s => s
                .SetProperty(u => u.FailedLoginCount, 0)
                .SetProperty(u => u.LockoutEndUtc, (DateTime?)null), CancellationToken.None);
        }

        if (verdict == PasswordVerificationResult.SuccessRehashNeeded)
        {
            var newHash = passwords.Hash(password);
            await db.Users.Where(u => u.Id == user.Id)
                .ExecuteUpdateAsync(s => s.SetProperty(u => u.PasswordHash, newHash), CancellationToken.None);
        }

        var (token, expires) = tokens.Create(user);
        var dto = new UserDto(user.Id, user.Phone, user.DisplayName, user.CreditBalance, user.InviteCode);
        return Results.Ok(new AuthResponse(token, expires, dto));
    }

    /// <summary>
    /// Tek atomik UPDATE: SET içindeki tüm ifadeler satırın ESKİ değerlerine göre hesaplanır.
    /// Eşzamanlı yanlış denemelerde sayaç kaybolmaz. CancellationToken.None: istemci bağlantıyı keserek
    /// sayacın yazılmasını engelleyemesin.
    /// </summary>
    private static Task RegisterFailure(AppDbContext db, Guid userId, DateTime now)
    {
        var lockUntil = (DateTime?)now.Add(LockoutDuration);
        return db.Users.Where(u => u.Id == userId).ExecuteUpdateAsync(s => s
            .SetProperty(u => u.LockoutEndUtc,
                u => u.FailedLoginCount + 1 >= MaxFailedAttempts ? lockUntil : u.LockoutEndUtc)
            .SetProperty(u => u.FailedLoginCount,
                u => u.FailedLoginCount + 1 >= MaxFailedAttempts ? 0 : u.FailedLoginCount + 1),
            CancellationToken.None);
    }

    private static IResult Invalid()
        => Result.Failure(Error.Unauthorized("invalid_credentials", "Telefon numarası veya şifre hatalı.")).ToProblem();
}