using System.Security.Claims;
using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;
using Dersakis.Shared;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Live;

public sealed record LiveListResponse(IReadOnlyList<LiveSessionDto> Items, bool HasMore, DateTime ServerNowUtc);

public sealed class ListLiveSessions : IEndpoint
{
    private const int MaxCourses = 20;
    private const int MaxPageSize = 30;

    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapGet("/live/sessions", Handle).RequireAuthorization().WithTags("Live");

    private static async Task<IResult> Handle(
        ClaimsPrincipal principal, AppDbContext db, TimeProvider clock, CancellationToken ct,
        string? kind = null, string? scope = "open", Guid[]? courseIds = null, int page = 1, int pageSize = 20)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        LiveKind? k = null;
        if (!string.IsNullOrWhiteSpace(kind))
        {
            if (!Enum.TryParse<LiveKind>(kind, true, out var parsed) || !Enum.IsDefined(parsed))
                return Result.Failure(Error.Validation("invalid_kind", "kind Voice veya Lesson olmalı.")).ToProblem();
            k = parsed;
        }

        var sc = (scope ?? "open").ToLowerInvariant();
        if (sc is not ("open" or "mine" or "active"))
            return Result.Failure(Error.Validation("invalid_scope", "scope open, mine veya active olmalı.")).ToProblem();

        if (courseIds is { Length: > MaxCourses })
            return Result.Failure(Error.Validation("too_many_courses", $"En fazla {MaxCourses} ders seçebilirsin.")).ToProblem();

        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, MaxPageSize);
        var now = clock.GetUtcNow().UtcDateTime;

        var q = db.LiveSessions.AsNoTracking().AsQueryable();
        if (k is { } kk) q = q.Where(s => s.Kind == kk);
        if (courseIds is { Length: > 0 }) q = q.Where(s => courseIds.Contains(s.CourseId));

        q = sc switch
        {
            // Satıştaki ilanlar. Kendi ilanların "mine" altında görünür.
            "open" => q.Where(s => s.HostId != userId &&
                ((s.Kind == LiveKind.Voice && s.Status == LiveStatus.Open) ||
                 (s.Kind == LiveKind.Lesson && s.Status == LiveStatus.Listed && s.ScheduledAtUtc > now))),
            "mine" => q.Where(s => s.HostId == userId || s.GuestId == userId),
            _ => q.Where(s => (s.HostId == userId || s.GuestId == userId) &&
                (s.Status == LiveStatus.Booked || s.Status == LiveStatus.Pending || s.Status == LiveStatus.Waiting ||
                 s.Status == LiveStatus.Live || s.Status == LiveStatus.AwaitingApproval))
        };

        var rows = LiveQueries.Project(db, q);
        rows = sc == "open" && k == LiveKind.Lesson
            ? rows.OrderBy(r => r.Session.ScheduledAtUtc).ThenBy(r => r.Session.Id)
            : rows.OrderByDescending(r => r.Session.CreatedAtUtc).ThenByDescending(r => r.Session.Id);

        var list = await rows.Skip((page - 1) * pageSize).Take(pageSize + 1).ToListAsync(ct);
        var hasMore = list.Count > pageSize;

        var items = list.Take(pageSize).Select(r => LiveQueries.ToDto(r, userId, now)).ToList();
        return Results.Ok(new LiveListResponse(items, hasMore, now));
    }
}