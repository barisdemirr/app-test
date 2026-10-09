using System.Security.Claims;
using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Dersakis.Shared;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Feed;

public sealed record FeedItemDto(
    Guid Id, string Title, string Topic, Guid CourseId, string CourseName,
    Guid CreatorId, string CreatorName, bool IsMine,
    int DurationMs, int QuestionCount, bool WatchCompleted, string StreamUrl);

public sealed record FeedResponse(IReadOnlyList<FeedItemDto> Items, long? NextCursor);

public sealed class GetFeed : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapGet("/feed", Handle).RequireAuthorization().WithTags("Feed");

    private static async Task<IResult> Handle(
        ClaimsPrincipal principal, AppDbContext db,
        [FromQuery] Guid[]? courseIds, long? cursor, int? limit, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        if (courseIds is { Length: > 20 })
            return Result.Failure(Error.Validation("too_many_courses", "En fazla 20 ders filtrelenebilir.")).ToProblem();

        var size = Math.Clamp(limit ?? 10, 1, 20);

        var query = db.Videos.AsNoTracking().Where(v => v.Status == VideoStatus.Published);
        if (courseIds is { Length: > 0 }) query = query.Where(v => courseIds.Contains(v.CourseId));
        if (cursor is { } after) query = query.Where(v => v.PublishSeq < after);

        // size + 1 satır çek: fazlalık "sonraki sayfa var" demek (COUNT sorgusu yok).
        var rows = await (
            from v in query
            join u in db.Users on v.CreatorId equals u.Id
            join c in db.Courses on v.CourseId equals c.Id
            orderby v.PublishSeq descending
            select new
            {
                v.Id,
                v.Title,
                v.Topic,
                v.CourseId,
                CourseName = c.Name,
                v.CreatorId,
                CreatorName = u.DisplayName,
                DurationMs = v.DurationMs!.Value,
                QuestionCount = v.Questions.Count,
                WatchCompleted = db.WatchSessions.Any(w =>
    w.UserId == userId && w.VideoId == v.Id && w.Status == WatchStatus.Completed),
                Seq = v.PublishSeq!.Value
            })
            .Take(size + 1)
            .ToListAsync(ct);

        var page = rows.Take(size).ToList();
        var items = page.Select(r => new FeedItemDto(
            r.Id, r.Title, r.Topic, r.CourseId, r.CourseName, r.CreatorId, r.CreatorName,
                        r.CreatorId == userId, r.DurationMs, r.QuestionCount, r.WatchCompleted, $"/api/v1/videos/{r.Id}/stream")).ToList();

        return Results.Ok(new FeedResponse(items, rows.Count > size ? page[^1].Seq : null));
    }
}