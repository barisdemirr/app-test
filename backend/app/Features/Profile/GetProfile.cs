using System.Security.Claims;
using Dersakis.Infrastructure.Database;
using Dersakis.Shared;

namespace Dersakis.Features.Profile;

public sealed class GetProfile : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapGet("/me/profile", Handle).RequireAuthorization().WithTags("Profile");

    private static async Task<IResult> Handle(ClaimsPrincipal principal, AppDbContext db, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        var profile = await ProfileQueries.BuildAsync(db, userId, ct);
        return profile is null
            ? Result.Failure(Error.Unauthorized("user_not_found", "Hesap bulunamadı.")).ToProblem()
            : Results.Ok(profile);
    }
}