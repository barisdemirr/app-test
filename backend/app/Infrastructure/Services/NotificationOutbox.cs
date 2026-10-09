using System.Text.Json;
using Dersakis.Domain.Entities;
using Dersakis.Domain.Enums;
using Dersakis.Infrastructure.Database;

namespace Dersakis.Infrastructure.Services;

public static class NotificationOutbox
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    /// <summary>
    /// Bildirimi bağlama ekler, SaveChanges ÇAĞIRMAZ. Çağıranın transaction'ı ile birlikte kalıcı olur:
    /// durum değişti ama bildirim yazılmadı (ya da tersi) diye bir durum oluşmaz.
    /// ttlSeconds: bu süreden sonra push gönderilmez (ör. "2 dk içinde gel" bildirimi 2 dk sonra anlamsız).
    /// </summary>
    public static void Enqueue(
        AppDbContext db, Guid userId, NotificationType type, string title, string body,
        object? data, DateTime now, int? ttlSeconds = null)
    {
        db.Notifications.Add(new Notification
        {
            Id = Guid.CreateVersion7(),
            CreatedAtUtc = now,
            UserId = userId,
            Type = type,
            Title = Trim(title, 80),
            Body = Trim(body, 300),
            DataJson = data is null ? null : Trim(JsonSerializer.Serialize(data, Json), 500),
            TtlSeconds = ttlSeconds,
            Delivery = PushDelivery.Pending,
            NextPushAtUtc = now
        });
    }

    private static string Trim(string value, int max) => value.Length <= max ? value : value[..max];
}