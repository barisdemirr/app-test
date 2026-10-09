using Dersakis.Infrastructure.Database;
using Dersakis.Shared;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Health;

public sealed class GetHealth : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app) => app.MapGet("/health", Handle);

    private static async Task<IResult> Handle(AppDbContext db, CancellationToken ct)
    {
        var ok = await db.Database.CanConnectAsync(ct);
        return ok
            ? Results.Ok(new { status = "ok" })
            : Results.Problem(statusCode: 503, title: "db_unreachable");
    }
}