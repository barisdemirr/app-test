using System.Security.Claims;
using Dersakis.Domain.Entities;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Profile;

public sealed record PreferencesDto(IReadOnlyList<Guid> CourseIds, IReadOnlyList<string> Interests, IReadOnlyList<string> AvailableInterests);
public sealed record UpdatePreferencesRequest(Guid[]? CourseIds, string[]? Interests);

public sealed class Preferences : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("/me/preferences", Get).RequireAuthorization().WithTags("Profile");
        app.MapPut("/me/preferences", Put).RequireAuthorization()
           .RequireRateLimiting(RateLimitPolicies.Write).WithTags("Profile");
    }

    private static async Task<IResult> Get(ClaimsPrincipal principal, AppDbContext db, ProfileSettings cfg, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        return Results.Ok(await ReadAsync(db, cfg, userId, ct));
    }

    private static async Task<IResult> Put(
        UpdatePreferencesRequest req, ClaimsPrincipal principal, AppDbContext db,
        CreditService accountLock, ProfileSettings cfg, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        var courseIds = (req.CourseIds ?? []).Distinct().ToArray();

        // İlgi alanları config'teki listeden seçilir, yazılış biçimi config'teki haline çevrilir.
        var interests = new List<string>();
        foreach (var raw in req.Interests ?? [])
        {
            var match = cfg.Interests.FirstOrDefault(i => string.Equals(i, (raw ?? "").Trim(), StringComparison.OrdinalIgnoreCase));
            if (match is null)
                return Result.Failure(Error.Validation("validation_failed", "Geçersiz ilgi alanı seçildi.")).ToProblem();
            if (!interests.Contains(match)) interests.Add(match);
        }

        var error = new Validator()
            .Check(courseIds.Length is >= 1 and <= 20, "En az 1, en fazla 20 ders seçmelisin.")
            .Check(courseIds.All(c => c != Guid.Empty), "Geçersiz ders seçildi.")
            .ToError();
        if (error is not null) return Result.Failure(error).ToProblem();

        if (await db.Courses.CountAsync(c => courseIds.Contains(c.Id), ct) != courseIds.Length)
            return Result.Failure(Error.NotFound("course_not_found", "Seçilen derslerden biri bulunamadı.")).ToProblem();

        await db.RunInTransactionAsync<int>(async token =>
        {
            // Hesap kilidi: aynı kullanıcının paralel PUT'ları sıraya girer, liste yarım kalmaz.
            await accountLock.LockAccountAsync(userId, token);

            await db.UserCourses.Where(x => x.UserId == userId).ExecuteDeleteAsync(token);
            await db.UserInterests.Where(x => x.UserId == userId).ExecuteDeleteAsync(token);

            db.UserCourses.AddRange(courseIds.Select(c => new UserCourse { UserId = userId, CourseId = c }));
            db.UserInterests.AddRange(interests.Select(i => new UserInterest { UserId = userId, Interest = i }));
            await db.SaveChangesAsync(token);
            return 0;
        }, ct);

        return Results.Ok(await ReadAsync(db, cfg, userId, ct));
    }

    private static async Task<PreferencesDto> ReadAsync(AppDbContext db, ProfileSettings cfg, Guid userId, CancellationToken ct)
    {
        var courses = await db.UserCourses.AsNoTracking().Where(x => x.UserId == userId).Select(x => x.CourseId).ToListAsync(ct);
        var interests = await db.UserInterests.AsNoTracking().Where(x => x.UserId == userId).Select(x => x.Interest).ToListAsync(ct);

        // Config'teki sıraya göre döner, kararlı bir liste olur.
        return new PreferencesDto(courses, cfg.Interests.Where(interests.Contains).ToList(), cfg.Interests);
    }
}