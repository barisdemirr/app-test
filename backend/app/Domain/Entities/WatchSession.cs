using Dersakis.Domain.Enums;

namespace Dersakis.Domain.Entities;

/// <summary>Bir kullanıcının bir videoyu izleme oturumu. CreatedAtUtc = başlangıç anı (sunucu saati).</summary>
public sealed class WatchSession : BaseEntity
{
    public Guid UserId { get; init; }
    public Guid VideoId { get; init; }
    public int VideoDurationMs { get; init; }          // başlangıçtaki süre kopyası, sonradan değişmez
    public WatchStatus Status { get; set; } = WatchStatus.Active;
    public int WatchedMs { get; set; }                 // sunucunun doğruladığı izleme süresi
    public int LastPositionMs { get; set; }
    public DateTime LastHeartbeatAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
}