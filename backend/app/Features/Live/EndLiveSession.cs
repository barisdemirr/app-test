using System.Security.Claims;
using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Live;

public sealed class EndLiveSession : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapPost("/live/{id:guid}/end", Handle)
              .RequireAuthorization()
              .RequireRateLimiting(RateLimitPolicies.Write)
              .WithTags("Live");

    private static async Task<IResult> Handle(
        Guid id, ClaimsPrincipal principal, AppDbContext db, LiveSettings live, TimeProvider clock, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        try
        {
            await db.RunInTransactionAsync<bool>(async token =>
            {
                var s = await db.LiveSessions.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, token);
                if (s is null || LiveQueries.RoleOf(s, userId) == "none")
                    throw LiveRejected.From(Error.NotFound("live_session_not_found", "Oturum bulunamadı."));

                // Zaten bitmişse sessizce başarılı: ikinci taraf da "bitir" çağırabilir.
                if (s.Status is LiveStatus.AwaitingApproval or LiveStatus.Completed) return true;
                if (s.Status != LiveStatus.Live)
                    throw LiveRejected.From(Error.Conflict("not_live", "Görüşme şu an aktif değil."));

                await LiveSettlement.EndAsync(db, live, s, clock.GetUtcNow().UtcDateTime, token);
                return true;
            }, ct);
        }
        catch (LiveRejected r)
        {
            return r.Response;
        }

        var row = await LiveQueries.LoadAsync(db, id, ct);
        return Results.Ok(LiveQueries.ToDto(row!, userId, clock.GetUtcNow().UtcDateTime));
    }
}