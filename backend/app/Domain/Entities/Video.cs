using Dersakis.Domain.Enums;

namespace Dersakis.Domain.Entities;

public sealed class Video : BaseEntity
{
    public Guid CreatorId { get; init; }
    public Guid CourseId { get; init; }
    public required string Title { get; init; }
    public required string Topic { get; init; }

    public VideoStatus Status { get; set; } = VideoStatus.Draft;

    // Aşağıdakiler yükleme tamamlanınca SUNUCU tarafından doldurulur, istemciden asla alınmaz.
    public int? DurationMs { get; set; }
    public string? StoragePath { get; set; }
    public long? SizeBytes { get; set; }
    public DateTime? PublishedAtUtc { get; set; }
    public long? PublishSeq { get; set; }   // VideoPublishSeq sequence'inden, akış sıralaması için

    public List<VideoQuestion> Questions { get; init; } = [];
}