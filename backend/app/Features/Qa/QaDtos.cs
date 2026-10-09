using Dersakis.Domain.Entities;
using Dersakis.Infrastructure.Services;

namespace Dersakis.Features.Qa;

public sealed record QaQuestionDto(
    Guid Id, string Category, string Topic, string Text, string Mode, int Cost, int Reward,
    Guid AuthorId, string AuthorName, bool IsMine, int AnswerCount,
        bool HasBestAnswer, Guid? BestAnswerId, DateTime? SelectionDeadlineUtc, DateTime CreatedAtUtc, bool Refunded);

public sealed record QaAnswerDto(
    Guid Id, Guid AuthorId, string AuthorName, bool IsMine, string Text, bool IsBest,
    DateTime? EditableUntilUtc, DateTime? EditedAtUtc, DateTime CreatedAtUtc);

public static class QaMapping
{
    public static QaQuestionDto ToDto(QaQuestion q, string authorName, Guid viewerId, QaSettings cfg) => new(
        q.Id, q.Category, q.Topic, q.Text, q.Mode.ToString(), q.Cost, q.Reward,
        q.AuthorId, authorName, q.AuthorId == viewerId, q.AnswerCount,
        q.BestAnswerId is not null, q.BestAnswerId,
        // Seçim son tarihi: ilk cevaptan sonra BestAnswerWindowDays gün
        q.BestAnswerId is null && q.FirstAnswerAtUtc is { } first ? first.AddDays(cfg.BestAnswerWindowDays) : null,
                q.CreatedAtUtc, q.RefundedAtUtc is not null);

    public static QaAnswerDto ToDto(QaAnswer a, string authorName, Guid viewerId, bool isBest, QaSettings cfg)
    {
        var mine = a.AuthorId == viewerId;
        return new QaAnswerDto(a.Id, a.AuthorId, authorName, mine, a.Text, isBest,
            mine && !isBest ? a.CreatedAtUtc.AddSeconds(cfg.EditWindowSeconds) : null, a.EditedAtUtc, a.CreatedAtUtc);
    }
}