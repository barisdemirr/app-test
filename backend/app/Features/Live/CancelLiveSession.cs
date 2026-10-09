using System.Security.Claims;
using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Live;

public sealed class CancelLiveSession : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapPost("/live/{id:guid}/cancel", Handle)
              .RequireAuthorization()
              .RequireRateLimiting(RateLimitPolicies.Write)
              .RequireIdempotency()
              .WithTags("Live");

    private static async Task<IResult> Handle(
        Guid id, ClaimsPrincipal principal, AppDbContext db, CreditService credits, TimeProvider clock, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        try
        {
            await db.RunInTransactionAsync<bool>(async token =>
            {
                var now = clock.GetUtcNow().UtcDateTime;
                var s = await db.LiveSessions.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, token);
                if (s is null || s.HostId != userId)
                    throw LiveRejected.From(Error.NotFound("live_session_not_found", "Oturum bulunamadı."));

                bool ok;
                if (s is { Kind: LiveKind.Voice, Status: LiveStatus.Open })
                {
                    ok = await LiveSettlement.SettleAsync(db, credits, s, LiveStatus.Open, LiveStatus.Cancelled,
                        LiveOutcome.NoGuest, LiveMoney.RefundPayer, now, token);
                }
                else if (s is { Kind: LiveKind.Lesson, Status: LiveStatus.Listed })
                {
                    ok = await LiveSettlement.SettleAsync(db, credits, s, LiveStatus.Listed, LiveStatus.Cancelled,
                        LiveOutcome.NoGuest, LiveMoney.None, now, token);
                }
                else if (s is { Kind: LiveKind.Lesson, Status: LiveStatus.Booked } && s.ScheduledAtUtc > now)
                {
                    ok = await LiveSettlement.SettleAsync(db, credits, s, LiveStatus.Booked, LiveStatus.Cancelled,
                        LiveOutcome.HostNoShow, LiveMoney.RefundPayer, now, token);
                    if (ok && s.GuestId is { } student)
                        LiveSettlement.Notify(db, student, NotificationType.LessonCancelled,
                            "Eğitim iptal edildi",
                            $"\"{s.Title}\" eğitmen tarafından iptal edildi, {s.Price} kredin iade edildi.",
                            s, "open_session", now);
                }
                else
                {
                    throw LiveRejected.From(Error.Conflict("cannot_cancel", "Bu oturum artık iptal edilemez."));
                }

                // Arada biri katıldı ya da satın aldıysa koşullu UPDATE 0 satır etkiler: iptal olmaz.
                if (!ok) throw LiveRejected.From(Error.Conflict("cannot_cancel", "Bu oturum artık iptal edilemez."));
                await db.SaveChangesAsync(token);
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