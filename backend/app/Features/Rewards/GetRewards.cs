using System.Security.Claims;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Rewards;

public sealed record RewardDto(
    Guid Id, string Title, string Description, string Provider, int Cost,
    int? StockRemaining, int? PerUserLimit, int RedeemedByMe, bool Available);

public sealed record RewardEligibilityDto(DateTime? EligibleAtUtc, int DailyLimit, int RedeemedToday);

public sealed record RewardsResponse(IReadOnlyList<RewardDto> Items, RewardEligibilityDto Eligibility, DateTime ServerNowUtc);

public sealed class GetRewards : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapGet("/rewards", Handle).RequireAuthorization().WithTags("Rewards");

    private static async Task<IResult> Handle(
        ClaimsPrincipal principal, AppDbContext db, RewardSettings cfg, TimeProvider clock, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        var createdAt = await db.Users.AsNoTracking().Where(u => u.Id == userId)
            .Select(u => (DateTime?)u.CreatedAtUtc).FirstOrDefaultAsync(ct);
        if (createdAt is null)
            return Result.Failure(Error.Unauthorized("user_not_found", "Hesap bulunamadı.")).ToProblem();

        var now = clock.GetUtcNow().UtcDateTime;
        var since = TurkeyClock.StartOfTodayUtc(clock);

        var rows = await db.Rewards.AsNoTracking()
            .Where(r => r.IsActive)
            .OrderBy(r => r.SortOrder)
            .Select(r => new
            {
                r.Id,
                r.Title,
                r.Description,
                r.Provider,
                r.Cost,
                r.StockRemaining,
                r.PerUserLimit,
                Mine = db.RewardRedemptions.Count(x => x.UserId == userId && x.RewardId == r.Id)
            })
            .ToListAsync(ct);

        var today = await db.RewardRedemptions.CountAsync(x => x.UserId == userId && x.CreatedAtUtc >= since, ct);

        var items = rows.Select(r => new RewardDto(
            r.Id, r.Title, r.Description, r.Provider, r.Cost, r.StockRemaining, r.PerUserLimit, r.Mine,
            Available: (r.StockRemaining is null or > 0) && (r.PerUserLimit is null || r.Mine < r.PerUserLimit))).ToList();

        var eligibleAt = createdAt.Value.AddHours(cfg.MinAccountAgeHours);
        return Results.Ok(new RewardsResponse(
            items,
            new RewardEligibilityDto(eligibleAt > now ? eligibleAt : null, cfg.MaxRedemptionsPerDay, today),
            now));
    }
}