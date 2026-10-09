namespace Dersakis.Domain.Entities;

public sealed class QaAnswer : BaseEntity
{
    public Guid QuestionId { get; init; }
    public Guid AuthorId { get; init; }
    public required string Text { get; set; }
    public DateTime? EditedAtUtc { get; set; }
}