using Dersakis.Domain.Enums;

namespace Dersakis.Domain.Entities;

/// <summary>Uygulama içi bildirim kutusu ve push kuyruğu (outbox) aynı tablodadır.</summary>
public sealed class Notification : BaseEntity
{
    public Guid UserId { get; init; }
    public NotificationType Type { get; init; }
    public required string Title { get; init; }
    public required string Body { get; init; }
    public string? DataJson { get; init; }          // RN'de yönlendirme için: {"sessionId":"...","kind":"Voice"}
    public int? TtlSeconds { get; init; }           // bu süreden sonra push gönderilmez

    public DateTime? ReadAtUtc { get; set; }

    public PushDelivery Delivery { get; set; }
    public int PushAttempts { get; set; }
    public DateTime? NextPushAtUtc { get; set; }
    public DateTime? PushedAtUtc { get; set; }
    public string? LastError { get; set; }
}