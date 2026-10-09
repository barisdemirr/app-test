using System.Security.Claims;
using Dersakis.Infrastructure.Database;
using Dersakis.Shared;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Auth;

public sealed class GetCurrentUser : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapGet("/auth/me", Handle).RequireAuthorization().WithTags("Auth");

    private static async Task<IResult> Handle(ClaimsPrincipal principal, AppDbContext db, CancellationToken ct)
    {
        var userId = principal.GetUserId();
        if (userId is null)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        // Bakiye her zaman DB'den okunur, token içinde taşınmaz.
        var dto = await db.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new UserDto(u.Id, u.Phone, u.DisplayName, u.CreditBalance, u.InviteCode))
            .FirstOrDefaultAsync(ct);

        return dto is null
            ? Result.Failure(Error.Unauthorized("user_not_found", "Hesap bulunamadı.")).ToProblem()
            : Results.Ok(dto);
    }
}