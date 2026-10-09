using System.Security.Claims;
using Dersakis.Infrastructure.Database;
using Dersakis.Shared;

namespace Dersakis.Features.Live;

public sealed class GetLiveSession : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapGet("/live/{id:guid}", Handle).RequireAuthorization().WithTags("Live");

    /// <summary>Frontend bu uç noktayı 3-5 saniyede bir sorgular (gerçek zamanlı kanal yok).</summary>
    private static async Task<IResult> Handle(
        Guid id, ClaimsPrincipal principal, AppDbContext db, TimeProvider clock, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        var row = await LiveQueries.LoadAsync(db, id, ct);
        if (row is null || !LiveQueries.IsVisible(row.Session, LiveQueries.RoleOf(row.Session, userId)))
            return Result.Failure(Error.NotFound("live_session_not_found", "Oturum bulunamadı.")).ToProblem();

        return Results.Ok(LiveQueries.ToDto(row, userId, clock.GetUtcNow().UtcDateTime));
    }
}