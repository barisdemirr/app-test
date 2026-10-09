using Dersakis.Infrastructure.Services;
using Dersakis.Shared;

namespace Dersakis.Features.Qa;

public sealed record QaConfigResponse(
    IReadOnlyList<string> Categories, int TextQuestionCost, int VoiceQuestionCost,
    int TextBestReward, int VoiceBestReward, bool VoiceEnabled, int BestAnswerWindowDays, int EditWindowSeconds);

public sealed class GetQaConfig : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
        => app.MapGet("/qa/config", (QaSettings s) => Results.Ok(new QaConfigResponse(
               s.Categories, s.TextQuestionCost, s.VoiceQuestionCost, s.TextBestReward, s.VoiceBestReward,
               s.VoiceEnabled, s.BestAnswerWindowDays, s.EditWindowSeconds)))
           .RequireAuthorization().WithTags("QA");
}