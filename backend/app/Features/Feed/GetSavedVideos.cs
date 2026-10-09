using System.Security.Claims;
using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Dersakis.Shared;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Feed;

public sealed class GetSavedVideos : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapGet("/me/saved-videos", Handle).RequireAuthorization().WithTags("Feed");

    private static async Task<IResult> Handle(
        ClaimsPrincipal principal, AppDbContext db, long? cursor, int? limit, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        var size = Math.Clamp(limit ?? 10, 1, 20);

        var videos = db.Videos.AsNoTracking().Where(v =>
            v.Status == VideoStatus.Published &&
            db.VideoMarks.Any(m => m.UserId == userId && m.VideoId == v.Id && m.Kind == VideoMarkKind.Saved));
        if (cursor is { } after) videos = videos.Where(v => v.PublishSeq < after);

        var rows = await FeedQueries.Project(db, videos, userId)
            .OrderByDescending(r => r.Seq)
            .Take(size + 1)
            .ToListAsync(ct);

        var page = rows.Take(size).ToList();
        return Results.Ok(new FeedResponse(
            page.Select(r => FeedQueries.ToDto(r, userId)).ToList(),
            rows.Count > size ? page[^1].Seq : null));
    }
}