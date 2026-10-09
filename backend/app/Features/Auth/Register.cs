using System.Net.Mail;
using Dersakis.Domain.Entities;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Auth;

public sealed record RegisterRequest(string? Email, string? Password, string? DisplayName);

public sealed class Register : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapPost("/auth/register", Handle).AllowAnonymous()
        .RequireRateLimiting(RateLimitPolicies.Auth).WithTags("Auth");

    private static async Task<IResult> Handle(
        RegisterRequest req, AppDbContext db, PasswordService passwords, TokenService tokens, CancellationToken ct)
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

        // Hızlı yol: gereksiz hash maliyetinden kaçınır. Asıl güvence aşağıdaki unique index'tir.
        if (await db.Users.AnyAsync(u => u.NormalizedEmail == normalized, ct))
            return EmailTaken();

        var user = new User
        {
            Email = email,
            NormalizedEmail = normalized,
            DisplayName = name,
            PasswordHash = passwords.Hash(password)
        };

        db.Users.Add(user);
        try
        {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (ex.IsUniqueViolation())
        {
            // Yarış: AnyAsync ile Add arasında aynı e-postayı başka bir istek eklediyse buraya düşer.
            return EmailTaken();
        }

        var (token, expires) = tokens.Create(user);
        var dto = new UserDto(user.Id, user.Email, user.DisplayName, user.CreditBalance);
        return Results.Created("/api/v1/auth/me", new AuthResponse(token, expires, dto));
    }

    private static IResult EmailTaken()
        => Result.Failure(Error.Conflict("email_taken", "Bu e-posta ile zaten bir hesap var.")).ToProblem();
}