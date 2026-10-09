using Dersakis.Domain.Enums;

namespace Dersakis.Domain.Entities;

/// <summary>Kullanıcının bir videoya koyduğu işaret: kaydetti veya "öğrendim" dedi.</summary>
public sealed class VideoMark : BaseEntity
{
    public Guid UserId { get; init; }
    public Guid VideoId { get; init; }
    public VideoMarkKind Kind { get; init; }
}