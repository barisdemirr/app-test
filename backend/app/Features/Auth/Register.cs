using System.Net.Mail;
using Dersakis.Domain.Entities;
using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Auth;

public sealed record RegisterRequest(string? Email, string? Password, string? DisplayName);

public sealed class Register : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapPost("/auth/register", Handle).AllowAnonymous()
              .RequireRateLimiting(RateLimitPolicies.Auth).WithTags("Auth");

    private static async Task<IResult> Handle(
        RegisterRequest req, AppDbContext db, PasswordService passwords, TokenService tokens,
        CreditService credits, CreditSettings settings, CancellationToken ct)
    {
        var email = (req.Email ?? "").Trim();
        var name = (req.DisplayName ?? "").Trim();
        var password = req.Password ?? "";

        var error = new Validator()
            .Check(email.Length is > 0 and <= 254 && MailAddress.TryCreate(email, out var addr) && addr.Address == email,
                "Geçerli bir e-posta gir.")
            .Check(password.Length is >= 8 and <= 128, "Şifre 8 ile 128 karakter arasında olmalı.")
            .Check(name.Length is >= 2 and <= 40, "Görünen ad 2 ile 40 karakter arasında olmalı.")
            .ToError();
        if (error is not null) return Result.Failure(error).ToProblem();

        var normalized = User.NormalizeEmail(email);

        // Hızlı yol. Asıl güvence unique index.
        if (await db.Users.AnyAsync(u => u.NormalizedEmail == normalized, ct))
            return EmailTaken();

        var passwordHash = passwords.Hash(password); // transaction dışında: pahalı iş, deadlock'ta tekrarlanmasın

        try
        {
            var (user, balance) = await db.RunInTransactionAsync<(User User, int Balance)>(async token =>
            {
                var u = new User
                {
                    Email = email,
                    NormalizedEmail = normalized,
                    DisplayName = name,
                    PasswordHash = passwordHash
                };
                db.Users.Add(u);
                await db.SaveChangesAsync(token);

                // RefId = kullanıcı id'si: ledger unique index'i sayesinde kişiye en fazla bir kez verilir.
                var grant = await credits.GrantAsync(u.Id, settings.SignupBonus, CreditReason.SignupBonus, u.Id, token);
                if (grant.IsFailure)
                    throw new InvalidOperationException($"Kayıt bonusu verilemedi: {grant.Error!.Code}"); // rollback

                return (u, grant.Value.Balance);
            }, ct);

            var (token, expires) = tokens.Create(user);
            var dto = new UserDto(user.Id, user.Email, user.DisplayName, balance);
            return Results.Created("/api/v1/auth/me", new AuthResponse(token, expires, dto));
        }
        catch (DbUpdateException ex) when (ex.IsUniqueViolation())
        {
            return EmailTaken(); // iki eşzamanlı kayıt yarışında kaybeden taraf
        }
    }

    private static IResult EmailTaken()
        => Result.Failure(Error.Conflict("email_taken", "Bu e-posta ile zaten bir hesap var.")).ToProblem();
}