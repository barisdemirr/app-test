using System.Globalization;
using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Videos;

public sealed record UploadResult(Guid Id, string Status, int DurationMs, bool AlreadyPublished);

public sealed class UploadVideoContent : IEndpoint
{
    private const int MinBytes = 1024;

    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapPut("/videos/{id:guid}/content", Handle)
              .RequireAuthorization()
              .RequireRateLimiting(RateLimitPolicies.Upload)
              .WithTags("Videos");

    private static async Task<IResult> Handle(
        Guid id, HttpContext http, AppDbContext db, VideoStorage storage,
        VideoSettings settings, TimeProvider clock, CancellationToken ct)
    {
        if (http.User.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        var existing = await db.Videos.AsNoTracking()
            .Where(v => v.Id == id && v.CreatorId == userId)
            .Select(v => new { v.Status, v.DurationMs })
            .FirstOrDefaultAsync(ct);

        if (existing is null || existing.Status == VideoStatus.Removed)
            return Result.Failure(Error.NotFound("video_not_found", "Video bulunamadı.")).ToProblem();

        if (existing.Status == VideoStatus.Published)
            return Results.Ok(new UploadResult(id, "Published", existing.DurationMs!.Value, AlreadyPublished: true));

        var request = http.Request;

        if (request.ContentType is not { } contentType || !contentType.StartsWith("video/mp4", StringComparison.OrdinalIgnoreCase))
            return Results.Problem(statusCode: 415, title: "unsupported_media_type", detail: "Content-Type video/mp4 olmalı.");

        if (request.ContentLength is { } declared && declared > settings.MaxFileBytes)
            return TooLarge(settings);

        // Kestrel'in varsayılan 30 MB gövde sınırını bu istek için bizim sınırımıza çıkar.
        var bodyLimit = http.Features.Get<IHttpMaxRequestBodySizeFeature>();
        if (bodyLimit is { IsReadOnly: false }) bodyLimit.MaxRequestBodySize = settings.MaxFileBytes;

        var (relative, full) = storage.NewPath(id, clock.GetUtcNow().UtcDateTime);
        var published = false;

        try
        {
            long size;
            try
            {
                await using var fs = new FileStream(full, new FileStreamOptions
                {
                    Mode = FileMode.CreateNew,
                    Access = FileAccess.Write,
                    Share = FileShare.None,
                    Options = FileOptions.Asynchronous,
                    BufferSize = 81920
                });
                await request.Body.CopyToAsync(fs, ct);
                size = fs.Length;
            }
            catch (BadHttpRequestException e) when (e.StatusCode == StatusCodes.Status413PayloadTooLarge)
            {
                return TooLarge(settings);
            }
            catch (BadHttpRequestException)
            {
                return Invalid("Yükleme tamamlanamadı (bağlantı kesildi veya gövde bozuk). Tekrar dene.");
            }

            if (size < MinBytes) return Invalid("Dosya çok küçük veya boş.");

            var durationMs = 0;
            await using (var fs = File.OpenRead(full))
            {
                if (!Mp4Inspector.TryReadDuration(fs, out durationMs))
                    return Invalid("Dosya geçerli, eksiksiz ve parçalı (fragmented) olmayan bir MP4 olmalı.");
            }

            var seconds = durationMs / 1000.0;
            if (seconds < settings.MinDurationSeconds || seconds > settings.MaxDurationSeconds)
                return Result.Failure(Error.Validation("invalid_duration",
                    $"Video süresi {settings.MinDurationSeconds} ile {settings.MaxDurationSeconds} saniye arasında olmalı " +
                    $"(yüklenen: {seconds.ToString("0.#", CultureInfo.InvariantCulture)} sn).")).ToProblem();

            if (size / seconds < settings.MinBytesPerSecond)
                return Invalid("Dosya boyutu video süresiyle uyumsuz görünüyor.");

            // Koşullu yayınlama: yalnızca hâlâ taslaksa ve bu kullanıcıya aitse. Yarışı kazanan tek istek olur.
            // CancellationToken.None: istemci tam bu anda koparsa DB ve dosya durumu ayrışmasın.
            var now = clock.GetUtcNow().UtcDateTime;
            var rows = await db.Database.ExecuteSqlInterpolatedAsync($@"
                UPDATE Videos SET
                    Status = {(byte)VideoStatus.Published},
                    DurationMs = {durationMs},
                    StoragePath = {relative},
                    SizeBytes = {size},
                    PublishedAtUtc = {now},
                    PublishSeq = NEXT VALUE FOR dbo.VideoPublishSeq
                WHERE Id = {id} AND CreatorId = {userId} AND Status = {(byte)VideoStatus.Draft}", CancellationToken.None);

            // rows == 0 olsa bile EF bağlantı hatasında komutu yeniden denemiş olabilir (ilk deneme başarılıysa
            // ikincisi 0 satır döner). Bu yüzden asıl ölçüt: DB'deki dosya yolu bizim dosyamız mı?
            published = rows == 1 || await db.Videos.AsNoTracking()
                .AnyAsync(v => v.Id == id && v.StoragePath == relative, CancellationToken.None);

            if (published)
                return Results.Ok(new UploadResult(id, "Published", durationMs, AlreadyPublished: false));

            // Yarışı kaybettik: başka bir istek yayınlamış olabilir ya da taslak süresi dolup silinmiş olabilir.
            var winner = await db.Videos.AsNoTracking()
                .Where(v => v.Id == id && v.CreatorId == userId && v.Status == VideoStatus.Published)
                .Select(v => v.DurationMs).FirstOrDefaultAsync(CancellationToken.None);

            return winner is { } d
                ? Results.Ok(new UploadResult(id, "Published", d, AlreadyPublished: true))
                : Result.Failure(Error.Conflict("draft_unavailable",
                    "Taslak artık yüklemeye uygun değil (süresi dolmuş veya silinmiş olabilir). Yeniden oluştur.")).ToProblem();
        }
        finally
        {
            if (!published) storage.TryDelete(full); // hata, iptal, kopma, doğrulama reddi: hepsinde temizlik
        }
    }

    private static IResult Invalid(string message)
        => Result.Failure(Error.Validation("invalid_video", message)).ToProblem();

    private static IResult TooLarge(VideoSettings s)
        => Results.Problem(statusCode: 413, title: "payload_too_large",
            detail: $"Dosya en fazla {s.MaxFileBytes / (1024 * 1024)} MB olabilir.");
}