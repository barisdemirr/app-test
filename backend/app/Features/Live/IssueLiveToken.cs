using System.Security.Claims;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;

namespace Dersakis.Features.Live;

public sealed class IssueLiveToken : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapPost("/live/{id:guid}/token", Handle)
              .RequireAuthorization()
              .RequireRateLimiting(RateLimitPolicies.Write)
              .WithTags("Live");

    private static async Task<IResult> Handle(
        Guid id, ClaimsPrincipal principal, AppDbContext db, AgoraSettings agora, LiveSettings live,
        TimeProvider clock, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        if (!agora.IsConfigured)
            return Results.Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: "agora_not_configured",
                detail: "Canlı görüşme servisi henüz yapılandırılmadı.");

        var row = await LiveQueries.LoadAsync(db, id, ct);
        if (row is null || LiveQueries.RoleOf(row.Session, userId) == "none")
            return Result.Failure(Error.NotFound("live_session_not_found", "Oturum bulunamadı.")).ToProblem();

        if (!LiveTokens.Allowed(row.Session, userId))
            return Result.Failure(Error.Conflict("token_not_allowed", "Bu oturum için şu an token alınamaz.")).ToProblem();

        return Results.Ok(LiveTokens.Issue(row.Session, userId, agora, live, clock));
    }
}