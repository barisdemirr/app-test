using System.Security.Claims;
using Dersakis.Domain.Entities;
using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Live;

public sealed record CreateVoiceRequest(Guid? CourseId, string? Title, string? Description);
public sealed record CreateVoiceResponse(LiveSessionDto Session, int Balance);

public sealed class CreateVoiceSession : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapPost("/live/voice", Handle)
              .RequireAuthorization()
              .RequireRateLimiting(RateLimitPolicies.Write)
              .RequireIdempotency()
              .WithTags("Live");

    private static async Task<IResult> Handle(
        CreateVoiceRequest req, ClaimsPrincipal principal, AppDbContext db, CreditService credits,
        LiveSettings live, TimeProvider clock, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        var title = TextRules.Normalize(req.Title) ?? "";
        var description = TextRules.Normalize(req.Description) ?? "";

        var error = new Validator()
            .Check(req.CourseId is { } c && c != Guid.Empty, "Ders seçmelisin.")
            .Check(title.Length is >= 3 and <= 80 && TextRules.Clean(title), "Başlık 3 ile 80 karakter arasında olmalı.")
            .Check(description.Length is >= 5 and <= 500 && TextRules.Clean(description, allowNewlines: true),
                "Açıklama 5 ile 500 karakter arasında olmalı.")
            .ToError();
        if (error is not null) return Result.Failure(error).ToProblem();

        var courseId = req.CourseId!.Value;

        try
        {
            var (sessionId, balance) = await db.RunInTransactionAsync<(Guid, int)>(async token =>
            {
                // Hesap kilidi İLK iş: aynı kullanıcının paralel istekleri ilan limitini ve bakiyeyi aşamaz.
                if (!await credits.LockAccountAsync(userId, token))
                    throw LiveRejected.From(Error.Unauthorized("user_not_found", "Hesap bulunamadı."));

                if (!await db.Courses.AnyAsync(x => x.Id == courseId, token))
                    throw LiveRejected.From(Error.NotFound("course_not_found", "Ders bulunamadı."));

                var open = await db.LiveSessions.CountAsync(
                    x => x.HostId == userId && x.Kind == LiveKind.Voice && x.Status == LiveStatus.Open, token);
                if (open >= live.MaxOpenVoiceListingsPerUser)
                    throw LiveRejected.From(Error.Conflict("open_listing_limit",
                        $"En fazla {live.MaxOpenVoiceListingsPerUser} açık sesli ilanın olabilir."));

                var id = Guid.CreateVersion7();
                var now = clock.GetUtcNow().UtcDateTime;

                // Kredi, ilanla AYNI transaction'da escrow'a (oturum satırına) alınır.
                var spend = await credits.SpendAsync(userId, live.VoiceCost, CreditReason.LiveVoiceSpend, id, token);
                if (spend.IsFailure) throw new LiveRejected(spend.ToProblem());

                db.LiveSessions.Add(LiveSession.NewVoice(
                    id, now, userId, courseId, title, description,
                    live.VoiceCost, live.VoiceReward, TimeSpan.FromDays(live.VoiceOpenExpiryDays)));
                await db.SaveChangesAsync(token);

                return (id, spend.Value.Balance);
            }, ct);

            var row = await LiveQueries.LoadAsync(db, sessionId, ct);
            var now2 = clock.GetUtcNow().UtcDateTime;
            return Results.Json(new CreateVoiceResponse(LiveQueries.ToDto(row!, userId, now2), balance),
                statusCode: StatusCodes.Status201Created);
        }
        catch (LiveRejected r)
        {
            return r.Response; // transaction geri alındı
        }
    }
}