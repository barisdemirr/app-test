using System.Security.Claims;
using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Live;

public sealed record ReviewRequest(bool? Approve);
public sealed record ReviewResponse(LiveSessionDto Session);

public sealed class ReviewLiveSession : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapPost("/live/{id:guid}/review", Handle)
              .RequireAuthorization()
              .RequireRateLimiting(RateLimitPolicies.Write)
              .RequireIdempotency()
              .WithTags("Live");

    private static async Task<IResult> Handle(
        Guid id, ReviewRequest req, ClaimsPrincipal principal, AppDbContext db, CreditService credits,
        TimeProvider clock, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();
        if (req.Approve is not { } approve)
            return Result.Failure(Error.Validation("approve_required", "approve alanı true veya false olmalı.")).ToProblem();

        try
        {
            await db.RunInTransactionAsync<bool>(async token =>
            {
                var now = clock.GetUtcNow().UtcDateTime;
                var s = await db.LiveSessions.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, token);
                if (s is null || LiveQueries.RoleOf(s, userId) == "none")
                    throw LiveRejected.From(Error.NotFound("live_session_not_found", "Oturum bulunamadı."));
                if (s.PayerId != userId)
                    throw LiveRejected.From(Error.Forbidden("not_payer", "Bu oturumu değerlendirme yetkin yok."));
                if (s.Status == LiveStatus.Completed)
                    throw LiveRejected.From(Error.Conflict("already_settled", "Bu oturum zaten sonuçlandı."));
                if (s.Status != LiveStatus.AwaitingApproval)
                    throw LiveRejected.From(Error.Conflict("not_reviewable", "Bu oturum şu an değerlendirilemez."));

                var ok = await LiveSettlement.SettleAsync(db, credits, s,
                    LiveStatus.AwaitingApproval, LiveStatus.Completed,
                    approve ? LiveOutcome.Approved : LiveOutcome.Rejected,
                    approve ? LiveMoney.PayEarner : LiveMoney.RefundPayer, now, token);
                if (!ok) throw LiveRejected.From(Error.Conflict("already_settled", "Bu oturum zaten sonuçlandı."));

                // Kazanan tarafa sonuç bildirimi
                if (s.EarnerId is { } earner)
                    LiveSettlement.Notify(db, earner, NotificationType.SessionSettled,
                        approve ? "Kredi kazandın" : "Değerlendirme olumsuz",
                        approve ? $"+{s.Payout} kredi hesabına geçti." : "Bu oturumdan kredi kazanılmadı.",
                        s, "open_session", now);
                await db.SaveChangesAsync(token);
                return true;
            }, ct);
        }
        catch (LiveRejected r)
        {
            return r.Response;
        }

        var row = await LiveQueries.LoadAsync(db, id, ct);
        return Results.Ok(new ReviewResponse(LiveQueries.ToDto(row!, userId, clock.GetUtcNow().UtcDateTime)));
    }
}