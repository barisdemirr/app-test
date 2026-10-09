using Dersakis.Domain.Entities;
using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.VideoMarks;

public sealed record MarkResponse(Guid VideoId, string Kind, bool Active);

public sealed class VideoMarkEndpoints : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        Map(app, "save", VideoMarkKind.Saved);
        Map(app, "learned", VideoMarkKind.Learned);
    }

    private static void Map(IEndpointRouteBuilder app, string segment, VideoMarkKind kind)
    {
        var route = $"/videos/{{id:guid}}/{segment}";

        app.MapPut(route, (Guid id, HttpContext http, AppDbContext db, CancellationToken ct) => Add(id, kind, http, db, ct))
           .RequireAuthorization().RequireRateLimiting(RateLimitPolicies.Write).WithTags("Videos");

        app.MapDelete(route, (Guid id, HttpContext http, AppDbContext db, CancellationToken ct) => Remove(id, kind, http, db, ct))
           .RequireAuthorization().RequireRateLimiting(RateLimitPolicies.Write).WithTags("Videos");
    }

    /// <summary>Doğal olarak idempotent: işaret zaten varsa hiçbir şey yapılmaz, yine aynı cevap döner.</summary>
    private static async Task<IResult> Add(Guid id, VideoMarkKind kind, HttpContext http, AppDbContext db, CancellationToken ct)
    {
        if (http.User.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        var creatorId = await db.Videos.AsNoTracking()
            .Where(v => v.Id == id && v.Status == VideoStatus.Published)
            .Select(v => (Guid?)v.CreatorId).FirstOrDefaultAsync(ct);
        if (creatorId is null)
            return Result.Failure(Error.NotFound("video_not_found", "Video bulunamadı.")).ToProblem();

        if (kind == VideoMarkKind.Learned)
        {
            // Üretici bunu puan olarak topluyor: kendi videona ve izlemediğin videoya işaret koyamazsın.
            if (creatorId == userId)
                return Result.Failure(Error.Forbidden("own_video", "Kendi videonu 'öğrendim' olarak işaretleyemezsin.")).ToProblem();

            var watched = await db.WatchSessions.AsNoTracking().AnyAsync(w =>
                w.UserId == userId && w.VideoId == id && w.Status == WatchStatus.Completed, ct);
            if (!watched)
                return Result.Failure(Error.Forbidden("watch_required", "Önce videoyu sonuna kadar izlemelisin.")).ToProblem();
        }

        if (!await db.VideoMarks.AsNoTracking().AnyAsync(m => m.UserId == userId && m.VideoId == id && m.Kind == kind, ct))
        {
            db.VideoMarks.Add(new VideoMark { UserId = userId, VideoId = id, Kind = kind });
            try
            {
                await db.SaveChangesAsync(ct);
            }
            catch (DbUpdateException ex) when (ex.IsUniqueViolation())
            {
                // Paralel istek aynı işareti az önce ekledi: sonuç zaten istenen durumda.
            }
        }

        return Results.Ok(new MarkResponse(id, kind.ToString(), true));
    }

    private static async Task<IResult> Remove(Guid id, VideoMarkKind kind, HttpContext http, AppDbContext db, CancellationToken ct)
    {
        if (http.User.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        await db.VideoMarks.Where(m => m.UserId == userId && m.VideoId == id && m.Kind == kind).ExecuteDeleteAsync(ct);
        return Results.Ok(new MarkResponse(id, kind.ToString(), false));
    }
}