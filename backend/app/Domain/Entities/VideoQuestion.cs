namespace Dersakis.Domain.Entities;

public sealed class VideoQuestion : BaseEntity
{
    public Guid VideoId { get; init; }
    public byte Position { get; init; }                  // 1 veya 2
    public required string Text { get; init; }
    public required string Explanation { get; init; }
    public List<VideoOption> Options { get; init; } = [];
}