using Dersakis.Infrastructure.Database;
using Dersakis.Shared;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Courses;

public sealed record CourseDto(Guid Id, string Name, string Slug);

public sealed class GetCourses : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapGet("/courses", Handle).RequireAuthorization().WithTags("Courses");

    private static async Task<IResult> Handle(AppDbContext db, CancellationToken ct)
    {
        var items = await db.Courses.AsNoTracking()
            .OrderBy(c => c.SortOrder)
            .Select(c => new CourseDto(c.Id, c.Name, c.Slug))
            .ToListAsync(ct);
        return Results.Ok(items);
    }
}