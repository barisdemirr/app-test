using System.Security.Claims;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.RateLimiting;

namespace Dersakis.Features.Profile;

public sealed record UpdateProfileRequest(string? DisplayName, string? About);

public sealed class UpdateProfile : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapPut("/me/profile", Handle).RequireAuthorization()
              .RequireRateLimiting(RateLimitPolicies.Write).WithTags("Profile");

    private static async Task<IResult> Handle(
        UpdateProfileRequest req, ClaimsPrincipal principal, AppDbContext db, ProfileSettings cfg, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        if (req.DisplayName is null && req.About is null)
            return Result.Failure(Error.Validation("validation_failed", "Güncellenecek bir alan gönder.")).ToProblem();

        var name = req.DisplayName?.Trim();
        var about = req.About is null ? null : TextRules.Normalize(req.About);

        var error = new Validator()
            .Check(name is null || (name.Length is >= 2 and <= 40 && TextRules.Clean(name)), "Görünen ad 2 ile 40 karakter arasında olmalı.")
            .Check(about is null || (about.Length <= cfg.AboutMaxLength && TextRules.Clean(about, allowNewlines: true)),
                $"Hakkımda en fazla {cfg.AboutMaxLength} karakter olabilir.")
            .ToError();
        if (error is not null) return Result.Failure(error).ToProblem();

        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user is null)
            return Result.Failure(Error.Unauthorized("user_not_found", "Hesap bulunamadı.")).ToProblem();

        if (name is not null) user.DisplayName = name;
        if (about is not null) user.About = about;
        await db.SaveChangesAsync(ct);

        return Results.Ok(await ProfileQueries.BuildAsync(db, userId, ct));
    }
}