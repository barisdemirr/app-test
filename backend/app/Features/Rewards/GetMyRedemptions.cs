using System.Security.Claims;
using Dersakis.Infrastructure.Database;
using Dersakis.Shared;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Rewards;

public sealed record RedemptionDto(Guid Id, Guid RewardId, string Title, string Provider, string Code, int Cost, DateTime CreatedAtUtc);
public sealed record RedemptionsResponse(IReadOnlyList<RedemptionDto> Items, bool HasMore);

public sealed class GetMyRedemptions : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapGet("/rewards/redemptions", Handle).RequireAuthorization().WithTags("Rewards");

    private static async Task<IResult> Handle(
        ClaimsPrincipal principal, AppDbContext db, int? page, int? pageSize, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        var p = Math.Clamp(page ?? 1, 1, 10_000);
        var size = Math.Clamp(pageSize ?? 20, 1, 50);

        // size + 1 satır çekip fazlalıktan "sonraki sayfa var mı" bilgisini çıkarırız (COUNT sorgusu yok).
        var rows = await (
            from x in db.RewardRedemptions.AsNoTracking()
            join r in db.Rewards on x.RewardId equals r.Id
            where x.UserId == userId
            orderby x.CreatedAtUtc descending, x.Id descending
            select new { x.Id, x.RewardId, r.Title, r.Provider, x.Code, x.Cost, x.CreatedAtUtc })
            .Skip((p - 1) * size).Take(size + 1)
            .ToListAsync(ct);

        var items = rows.Take(size)
            .Select(x => new RedemptionDto(x.Id, x.RewardId, x.Title, x.Provider, VoucherCodes.Format(x.Code), x.Cost, x.CreatedAtUtc))
            .ToList();

        return Results.Ok(new RedemptionsResponse(items, rows.Count > size));
    }
}