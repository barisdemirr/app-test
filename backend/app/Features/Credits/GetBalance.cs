using System.Security.Claims;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Credits;

public sealed record BalanceDto(int Balance, int DailyEarned, int DailyCap, int DailyRemaining);

public sealed class GetBalance : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapGet("/credits/balance", Handle).RequireAuthorization().WithTags("Credits");

    private static async Task<IResult> Handle(
        ClaimsPrincipal principal, AppDbContext db, CreditSettings settings, TimeProvider clock, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        var u = await db.Users.AsNoTracking().Where(x => x.Id == userId)
            .Select(x => new { x.CreditBalance, x.DailyEarned, x.DailyEarnedDay })
            .FirstOrDefaultAsync(ct);
        if (u is null)
            return Result.Failure(Error.Unauthorized("user_not_found", "Hesap bulunamadı.")).ToProblem();

        // Sayaç başka bir güne aitse bugün için kazanım 0'dır.
        var earned = u.DailyEarnedDay == TurkeyClock.Today(clock) ? u.DailyEarned : 0;
        return Results.Ok(new BalanceDto(u.CreditBalance, earned, settings.DailyCap, Math.Max(0, settings.DailyCap - earned)));
    }
}