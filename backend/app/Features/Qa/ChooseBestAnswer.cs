using System.Security.Claims;
using Dersakis.Infrastructure.Services;
using Dersakis.Shared;

namespace Dersakis.Features.Qa;

public sealed record ChooseBestAnswerRequest(Guid? AnswerId);
public sealed record ChooseBestAnswerResponse(Guid QuestionId, Guid BestAnswerId, int Reward, string ChosenBy, bool AlreadyChosen);

public sealed class ChooseBestAnswer : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapPost("/qa/questions/{id:guid}/best-answer", Handle)
              .RequireAuthorization()
              .RequireRateLimiting(RateLimitPolicies.Write)
              .WithTags("QA");

    private static async Task<IResult> Handle(
        Guid id, ChooseBestAnswerRequest req, ClaimsPrincipal principal, QaAwardService awards, CancellationToken ct)
    {
        if (principal.GetUserId() is not { } userId)
            return Result.Failure(Error.Unauthorized("invalid_token", "Geçersiz oturum.")).ToProblem();
        if (req.AnswerId is null || req.AnswerId == Guid.Empty)
            return Result.Failure(Error.Validation("validation_failed", "answerId gerekli.")).ToProblem();

        var result = await awards.ChooseBestAsync(id, req.AnswerId.Value, userId, ct);
        return result.Match(r => Results.Ok(new ChooseBestAnswerResponse(r.QuestionId, r.AnswerId, r.Reward, r.ChosenBy.ToString(), r.AlreadyChosen)));
    }
}