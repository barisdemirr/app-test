namespace Dersakis.Domain.Entities;

public sealed class VideoOption : BaseEntity
{
    public Guid QuestionId { get; init; }
    public required string Text { get; init; }
    public bool IsCorrect { get; init; }                 // Commit 7'de sadece sunucu içinde okunur
}