using System.Security.Claims;
using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Live;

public sealed record BookLessonResponse(LiveSessionDto Session, int Balance);

public sealed class BookLesson : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapPost("/live/{id:guid}/book", Handle)
              .RequireAuthorization()
              .RequireRateLimiting(RateLimitPolicies.Write)
              .RequireIdempotency()
              .WithTags("Live");

    private static async Task<IResult> Handle(
        Guid id, ClaimsPrincipal principal, AppDbContext db, CreditService credits,
        LiveSettings live, TimeProvider clock, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        try
        {
            var balance = await db.RunInTransactionAsync<int>(async token =>
            {
                var now = clock.GetUtcNow().UtcDateTime;

                var s = await db.LiveSessions.AsNoTracking()
                            .FirstOrDefaultAsync(x => x.Id == id && x.Kind == LiveKind.Lesson, token)
                        ?? throw LiveRejected.From(Error.NotFound("live_session_not_found", "Eğitim bulunamadı."));

                if (s.HostId == userId)
                    throw LiveRejected.From(Error.Conflict("own_listing", "Kendi eğitimini satın alamazsın."));
                if (s.Status is LiveStatus.Cancelled or LiveStatus.Expired)
                    throw LiveRejected.From(Error.Conflict("session_closed", "Bu eğitim artık satışta değil."));
                if (s.Status != LiveStatus.Listed)
                    throw LiveRejected.From(Error.Conflict("session_taken", "Bu eğitimi başka biri aldı."));
                if (s.ScheduledAtUtc <= now)
                    throw LiveRejected.From(Error.Conflict("lesson_started", "Bu eğitimin saati geldi."));

                // 1) Oturum satırını ele geçir (satır kilidi). Kazanan tek kişi.
                var rows = await db.LiveSessions
                    .Where(x => x.Id == id && x.Status == LiveStatus.Listed && x.GuestId == null
                                && x.HostId != userId && x.ScheduledAtUtc > now)
                    .ExecuteUpdateAsync(u => u
                        .SetProperty(x => x.GuestId, (Guid?)userId)
                        .SetProperty(x => x.Status, LiveStatus.Booked)
                        .SetProperty(x => x.EscrowCredits, s.Price), token);
                if (rows == 0)
                    throw LiveRejected.From(Error.Conflict("session_taken", "Bu eğitimi başka biri aldı."));

                // 2) Öğrencinin hesabını kilitle. Kilidi aldıktan SONRA çakışmaya bakmak, aynı öğrencinin
                //    paralel iki satın almasını sıraya dizer.
                if (!await credits.LockAccountAsync(userId, token))
                    throw LiveRejected.From(Error.Unauthorized("user_not_found", "Hesap bulunamadı."));

                var start = s.ScheduledAtUtc!.Value;
                if (await LiveSchedule.OverlapsAsync(db, live, userId, start, start.AddMinutes(s.DurationMinutes!.Value), id, token))
                    throw LiveRejected.From(Error.Conflict("schedule_conflict", "Bu saatte başka bir eğitimin var."));

                // 3) Kredi düşer. Yetmezse istisna: 1. adım dahil her şey geri alınır.
                var spend = await credits.SpendAsync(userId, s.Price, CreditReason.LiveLessonPurchase, id, token);
                if (spend.IsFailure) throw new LiveRejected(spend.ToProblem());

                // 4) Eğitmene bildirim, aynı transaction'da kuyruğa girer.
                NotificationOutbox.Enqueue(db, s.HostId, NotificationType.LessonBooked,
                    "Eğitimin satın alındı",
                    $"\"{s.Title}\" eğitimini bir öğrenci aldı.",
                    new { action = "open_session", sessionId = id, kind = "Lesson", scheduledAtUtc = s.ScheduledAtUtc }, now);
                await db.SaveChangesAsync(token);

                return spend.Value.Balance;
            }, ct);

            var row = await LiveQueries.LoadAsync(db, id, ct);
            return Results.Ok(new BookLessonResponse(
                LiveQueries.ToDto(row!, userId, clock.GetUtcNow().UtcDateTime), balance));
        }
        catch (LiveRejected r)
        {
            return r.Response;
        }
    }
}