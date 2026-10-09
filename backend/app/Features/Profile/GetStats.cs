using System.Security.Claims;
using Dersakis.Infrastructure.Database;
using Dersakis.Shared;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Profile;

public sealed record TopicStatDto(string Topic, int Answered, int Correct, int Percent);
public sealed record CourseStatDto(Guid CourseId, string CourseName, int Answered, int Correct, int Percent, IReadOnlyList<TopicStatDto> Topics);
public sealed record StatsResponse(int Answered, int Correct, int Percent, IReadOnlyList<CourseStatDto> Courses);

public sealed class GetStats : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapGet("/me/stats", Handle).RequireAuthorization().WithTags("Profile");

    private static async Task<IResult> Handle(ClaimsPrincipal principal, AppDbContext db, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        // Gruplama SQL'de yapılır: kullanıcının yüzlerce cevabı belleğe çekilmez.
        var rows = await (
            from a in db.QuizAttempts.AsNoTracking()
            where a.UserId == userId
            join v in db.Videos on a.VideoId equals v.Id
            join c in db.Courses on v.CourseId equals c.Id
            group a by new { v.CourseId, CourseName = c.Name, v.Topic } into g
            select new { g.Key.CourseId, g.Key.CourseName, g.Key.Topic, Answered = g.Count(), Correct = g.Count(x => x.IsCorrect) })
            .ToListAsync(ct);

        var courses = rows
            .GroupBy(r => new { r.CourseId, r.CourseName })
            .Select(g =>
            {
                var answered = g.Sum(r => r.Answered);
                var correct = g.Sum(r => r.Correct);
                return new CourseStatDto(g.Key.CourseId, g.Key.CourseName, answered, correct, Pct(correct, answered),
                    g.OrderByDescending(r => r.Answered).ThenBy(r => r.Topic)
                     .Select(r => new TopicStatDto(r.Topic, r.Answered, r.Correct, Pct(r.Correct, r.Answered))).ToList());
            })
            .OrderBy(c => c.CourseName)
            .ToList();

        var totalAnswered = courses.Sum(c => c.Answered);
        var totalCorrect = courses.Sum(c => c.Correct);
        return Results.Ok(new StatsResponse(totalAnswered, totalCorrect, Pct(totalCorrect, totalAnswered), courses));
    }

    private static int Pct(int correct, int answered)
        => answered == 0 ? 0 : (int)Math.Round(correct * 100.0 / answered, MidpointRounding.AwayFromZero);
}