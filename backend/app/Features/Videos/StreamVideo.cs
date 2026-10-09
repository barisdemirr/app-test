using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Videos;

public sealed class StreamVideo : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        // Anonim: <video src> etiketi Authorization header gönderemez. Yalnızca yayınlanmış videolar sunulur.
        => app.MapGet("/videos/{id:guid}/stream", Handle).AllowAnonymous().WithTags("Videos");

    private static async Task<IResult> Handle(
        Guid id, HttpContext http, AppDbContext db, VideoStorage storage, CancellationToken ct)
    {
        var path = await db.Videos.AsNoTracking()
            .Where(v => v.Id == id && v.Status == VideoStatus.Published)
            .Select(v => v.StoragePath)
            .FirstOrDefaultAsync(ct);

        var full = path is null ? null : storage.Resolve(path);
        if (full is null || !File.Exists(full))
            return Result.Failure(Error.NotFound("video_not_found", "Video bulunamadı.")).ToProblem();

        // Yayınlanmış dosya adı benzersiz ve değişmez, tarayıcı önbelleğe alabilir.
        http.Response.Headers.CacheControl = "public, max-age=3600";
        http.Response.Headers.XContentTypeOptions = "nosniff";
        return Results.File(full, "video/mp4", enableRangeProcessing: true);
    }
}