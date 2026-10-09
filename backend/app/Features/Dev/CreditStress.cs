using System.Security.Claims;
using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Dev;

public sealed record StressRequest(string? Mode, int? Count, int? Cost);

/// <summary>GEÇİCİ: kredi servisinin paralel istek altındaki doğruluğunu test eder. Sadece Development.</summary>
public sealed class CreditStress : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        if (!app.ServiceProvider.GetRequiredService<IHostEnvironment>().IsDevelopment()) return;
        app.MapPost("/dev/credits/stress", Handle).RequireAuthorization().WithTags("Dev");
    }

    private static async Task<IResult> Handle(
        StressRequest req, ClaimsPrincipal principal, IServiceScopeFactory scopes,
        AppDbContext db, CreditSettings settings, TimeProvider clock, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        var mode = req.Mode ?? "earn-distinct";
        if (mode is not ("earn-distinct" or "earn-same" or "spend"))
            return Result.Failure(Error.Validation("bad_mode", "mode: earn-distinct, earn-same veya spend olmalı.")).ToProblem();

        var n = Math.Clamp(req.Count ?? 20, 1, 50); // varsayılan bağlantı havuzu 100, 50 güvenli
        var cost = Math.Clamp(req.Cost ?? 10, 1, 1000);
        var before = await db.Users.AsNoTracking().Where(u => u.Id == userId).Select(u => u.CreditBalance).FirstAsync(ct);
        var sharedRef = Guid.CreateVersion7();

        var results = await Task.WhenAll(Enumerable.Range(0, n).Select(async _ =>
        {
            using var scope = scopes.CreateScope();
            var credits = scope.ServiceProvider.GetRequiredService<CreditService>();
            var refId = mode == "earn-same" ? sharedRef : Guid.CreateVersion7();

            return mode == "spend"
                ? await credits.SpendAsync(userId, cost, CreditReason.RewardRedeem, refId, CancellationToken.None)
                : await credits.EarnAsync(userId, settings.QuizReward, CreditReason.QuizCorrect, refId, CancellationToken.None);
        }));

        var after = await db.Users.AsNoTracking().Where(u => u.Id == userId)
            .Select(u => new { u.CreditBalance, u.DailyEarned, u.DailyEarnedDay }).FirstAsync(ct);
        var ledgerSum = await db.CreditTransactions.Where(t => t.UserId == userId).SumAsync(t => t.Amount, ct);

        return Results.Ok(new
        {
            mode,
            requested = n,
            callsWithCredit = results.Count(r => r.IsSuccess && r.Value.Applied > 0),
            callsAlreadyApplied = results.Count(r => r.IsSuccess && r.Value.AlreadyApplied),
            callsCapReached = results.Count(r => r.IsSuccess && !r.Value.AlreadyApplied && r.Value.Applied == 0),
            callsRejected = results.Count(r => r.IsFailure),
            rejectedCodes = results.Where(r => r.IsFailure).Select(r => r.Error!.Code).Distinct(),
            totalApplied = results.Where(r => r.IsSuccess).Sum(r => r.Value.Applied),
            balanceBefore = before,
            balanceAfter = after.CreditBalance,
            dailyEarnedToday = after.DailyEarnedDay == TurkeyClock.Today(clock) ? after.DailyEarned : 0,
            ledgerSum,
            consistent = ledgerSum == after.CreditBalance
        });
    }
}