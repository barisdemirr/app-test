using System.Security.Claims;
using Dersakis.Domain.Entities;
using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Rewards;

public sealed record RedeemResponse(
    Guid RedemptionId, Guid RewardId, string Title, string Code, int Cost, int Balance, DateTime CreatedAtUtc);

public sealed class RedeemReward : IEndpoint
{
    /// <summary>Beklenen bir red durumu. İstisna olarak fırlatılır ki transaction GERİ ALINSIN (stok düşümü gibi yazılanlar boşa gitsin).</summary>
    private sealed class Rejected(IResult response) : Exception
    {
        public IResult Response { get; } = response;
    }

    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapPost("/rewards/{id:guid}/redeem", Handle)
              .RequireAuthorization()
              .RequireRateLimiting(RateLimitPolicies.Write)
              .RequireIdempotency()
              .WithTags("Rewards");

    private static async Task<IResult> Handle(
        Guid id, ClaimsPrincipal principal, AppDbContext db, CreditService credits,
        RewardSettings cfg, TimeProvider clock, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        try
        {
            return await db.RunInTransactionAsync<IResult>(async token =>
            {
                // 1) Hesap kilidi İLK iş: günlük ve kişi başı sayımlar aynı kullanıcının paralel isteğiyle aşılamaz.
                //    Kilit sırası: hesap, sonra ödül satırı.
                if (!await credits.LockAccountAsync(userId, token))
                    throw Reject(Error.Unauthorized("user_not_found", "Hesap bulunamadı."));

                // 2) Ödül bilgisi kilitten SONRA okunur, harcanan fiyat ile gösterilen fiyat tutarlı olur.
                var reward = await db.Rewards.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id && r.IsActive, token);
                if (reward is null)
                    throw Reject(Error.NotFound("reward_not_found", "Ödül bulunamadı."));

                var now = clock.GetUtcNow().UtcDateTime;

                // 3) Hesap yaşı: sahte hesapla davet ödülünü hemen harcama yolunu yavaşlatır.
                var createdAt = await db.Users.AsNoTracking().Where(u => u.Id == userId).Select(u => u.CreatedAtUtc).FirstAsync(token);
                var eligibleAt = createdAt.AddHours(cfg.MinAccountAgeHours);
                if (now < eligibleAt)
                    throw new Rejected(Results.Problem(
                        statusCode: StatusCodes.Status403Forbidden, title: "account_too_new",
                        detail: "Hesabın ödül alabilmek için henüz çok yeni. Biraz sonra tekrar dene.",
                        extensions: new Dictionary<string, object?> { ["eligibleAtUtc"] = eligibleAt, ["serverNowUtc"] = now }));

                // 4) Günlük limit (Türkiye saatiyle)
                var since = TurkeyClock.StartOfTodayUtc(clock);
                if (await db.RewardRedemptions.CountAsync(x => x.UserId == userId && x.CreatedAtUtc >= since, token) >= cfg.MaxRedemptionsPerDay)
                    throw Reject(Error.TooMany("daily_redeem_limit",
                        $"Günlük ödül limitine ({cfg.MaxRedemptionsPerDay}) ulaştın. Yarın tekrar dene."));

                // 5) Ödül başına kişi limiti
                if (reward.PerUserLimit is { } limit
                    && await db.RewardRedemptions.CountAsync(x => x.UserId == userId && x.RewardId == id, token) >= limit)
                    throw Reject(Error.Conflict("reward_limit_reached", "Bu ödülü alabileceğin maksimum sayıya ulaştın."));

                // 6) Atomik stok düşümü: tek UPDATE hem kontrol eder hem düşer. Stok null ise sınırsız (null - 1 = null).
                var rows = await db.Rewards
                    .Where(r => r.Id == id && r.IsActive && (r.StockRemaining == null || r.StockRemaining > 0))
                    .ExecuteUpdateAsync(s => s.SetProperty(r => r.StockRemaining, r => r.StockRemaining - 1), token);
                if (rows != 1)
                    throw Reject(Error.Conflict("reward_sold_out", "Bu ödülün stoğu tükendi."));

                // 7) Kredi harcama: bakiye yetmezse 409 insufficient_credits ve stok düşümü dahil her şey geri alınır.
                //    RefId = alım id'si: ledger'da her alım kendi satırını alır.
                var redemptionId = Guid.CreateVersion7();
                var spend = await credits.SpendAsync(userId, reward.Cost, CreditReason.RewardRedeem, redemptionId, token);
                if (spend.IsFailure) throw new Rejected(spend.ToProblem());

                // 8) Alım kaydı, kredi ve stokla AYNI transaction'da
                var redemption = new RewardRedemption
                {
                    Id = redemptionId,
                    CreatedAtUtc = now,
                    UserId = userId,
                    RewardId = id,
                    Code = VoucherCodes.Generate(),
                    Cost = reward.Cost
                };
                db.RewardRedemptions.Add(redemption);
                await db.SaveChangesAsync(token);

                return Results.Json(
                    new RedeemResponse(redemptionId, id, reward.Title, VoucherCodes.Format(redemption.Code),
                        reward.Cost, spend.Value.Balance, now),
                    statusCode: StatusCodes.Status201Created);
            }, ct);
        }
        catch (Rejected r)
        {
            return r.Response; // transaction geri alındı
        }
    }

    private static Rejected Reject(Error e) => new(Result.Failure(e).ToProblem());
}