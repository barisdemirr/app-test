namespace Dersakis.Features.Ai;

public sealed record AiChatTurn(string? Role, string? Text);
public sealed record AiChatRequest(List<AiChatTurn>? Messages);

public sealed record AiWrongAnswerDto(
    Guid QuestionId, string Course, string Topic, string VideoTitle, string Question,
    string YourAnswer, string CorrectAnswer, string Explanation, DateTime AnsweredAtUtc);

public sealed record AiPlanTaskDto(string Topic, int Minutes, string What);
public sealed record AiPlanDayDto(string Day, IReadOnlyList<AiPlanTaskDto> Tasks);
public sealed record AiPlanDto(string Title, IReadOnlyList<AiPlanDayDto> Days);

/// <summary>Alıştırma sorusu: model üretir, doğru şık istemcide sorulur (puan/kredi etkisi yoktur).</summary>
public sealed record AiPracticeDto(string Course, string Question, IReadOnlyList<string> Options, int CorrectIndex, string Explanation);

public sealed record AiChatResponse(
    string Reply,
    AiPlanDto? Plan,
    IReadOnlyList<AiPracticeDto> Practice,
    IReadOnlyList<AiWrongAnswerDto> WrongAnswers,
    IReadOnlyList<string> Suggestions,
    int RemainingToday);
