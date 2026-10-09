using System.Security.Claims;
using Dersakis.Infrastructure.Database;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;
using Microsoft.EntityFrameworkCore;

namespace Dersakis.Features.Qa;

// ServerNowUtc: istemci saati yanlış olsa da düzenleme geri sayımı doğru hesaplansın (EditableUntilUtc - ServerNowUtc).
public sealed record QaQuestionDetailResponse(QaQuestionDto Question, IReadOnlyList<QaAnswerDto> Answers, DateTime ServerNowUtc);

public sealed class GetQaQuestion : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapGet("/qa/questions/{id:guid}", Handle).RequireAuthorization().WithTags("QA");

    private static async Task<IResult> Handle(
        Guid id, ClaimsPrincipal principal, AppDbContext db, QaSettings cfg, TimeProvider clock, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();

        var q = await (
            from x in db.QaQuestions.AsNoTracking()
            join u in db.Users on x.AuthorId equals u.Id
            where x.Id == id
            select new { x, AuthorName = u.DisplayName })
            .FirstOrDefaultAsync(ct);
        if (q is null)
            return Result.Failure(Error.NotFound("qa_question_not_found", "Soru bulunamadı.")).ToProblem();

        var answers = await (
            from a in db.QaAnswers.AsNoTracking()
            join u in db.Users on a.AuthorId equals u.Id
            where a.QuestionId == id
            orderby a.CreatedAtUtc, a.Id
            select new { a, AuthorName = u.DisplayName })
            .ToListAsync(ct);

        return Results.Ok(new QaQuestionDetailResponse(
            QaMapping.ToDto(q.x, q.AuthorName, userId, cfg),
            answers.Select(r => QaMapping.ToDto(r.a, r.AuthorName, userId, r.a.Id == q.x.BestAnswerId, cfg)).ToList(),
            clock.GetUtcNow().UtcDateTime));
    }
}