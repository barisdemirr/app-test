using System.Security.Claims;
using System.Text.Json;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Notifications;

public sealed record NotificationDto(Guid Id, string Type, string Title, string Body, JsonElement? Data, DateTime CreatedAtUtc, DateTime? ReadAtUtc);
public sealed record NotificationsResponse(IReadOnlyList<NotificationDto> Items, bool HasMore, int UnreadCount);
public sealed record MarkReadRequest(Guid[]? Ids, bool? All);

public sealed class NotificationEndpoints : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("/notifications", List).RequireAuthorization().WithTags("Notifications");
        app.MapPost("/notifications/read", MarkRead).RequireAuthorization()
           .RequireRateLimiting(RateLimitPolicies.Write).WithTags("Notifications");
    }

    private static async Task<IResult> List(
        ClaimsPrincipal principal, AppDbContext db, int? page, int? pageSize, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        var p = Math.Clamp(page ?? 1, 1, 10_000);
        var size = Math.Clamp(pageSize ?? 20, 1, 50);

        // size + 1 satır çekip fazlalıktan "sonraki sayfa var mı" bilgisini çıkarırız.
        var rows = await db.Notifications.AsNoTracking()
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAtUtc).ThenByDescending(n => n.Id)
            .Skip((p - 1) * size).Take(size + 1)
            .Select(n => new { n.Id, n.Type, n.Title, n.Body, n.DataJson, n.CreatedAtUtc, n.ReadAtUtc })
            .ToListAsync(ct);

        var unread = await db.Notifications.CountAsync(n => n.UserId == userId && n.ReadAtUtc == null, ct);

        var items = rows.Take(size).Select(n => new NotificationDto(
            n.Id, n.Type.ToString(), n.Title, n.Body,
            n.DataJson is null ? null : JsonSerializer.Deserialize<JsonElement>(n.DataJson),
            n.CreatedAtUtc, n.ReadAtUtc)).ToList();

        return Results.Ok(new NotificationsResponse(items, rows.Count > size, unread));
    }

    /// <summary>Doğal olarak idempotent: zaten okunmuş olanlara dokunmaz.</summary>
    private static async Task<IResult> MarkRead(
        MarkReadRequest req, ClaimsPrincipal principal, AppDbContext db, TimeProvider clock, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        var all = req.All == true;
        var error = new Validator()
            .Check(all || req.Ids is { Length: > 0 }, "ids ya da all gönder.")
            .Check(req.Ids is null || req.Ids.Length <= 200, "En fazla 200 bildirim işaretlenebilir.")
            .ToError();
        if (error is not null) return Result.Failure(error).ToProblem();

        var now = clock.GetUtcNow().UtcDateTime;
        var query = db.Notifications.Where(n => n.UserId == userId && n.ReadAtUtc == null);
        if (!all)
        {
            var ids = req.Ids!;
            query = query.Where(n => ids.Contains(n.Id));
        }
        await query.ExecuteUpdateAsync(s => s.SetProperty(n => n.ReadAtUtc, (DateTime?)now), ct);

        var unread = await db.Notifications.CountAsync(n => n.UserId == userId && n.ReadAtUtc == null, ct);
        return Results.Ok(new { unreadCount = unread });
    }
}