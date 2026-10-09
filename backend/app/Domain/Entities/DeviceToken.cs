using Dersakis.Domain.Enums;

namespace Dersakis.Domain.Entities;

public sealed class DeviceToken : BaseEntity
{
    public Guid UserId { get; set; }                // aynı telefona başka hesapla girilirse token yeni hesaba geçer
    public required string Token { get; init; }
    public required string Platform { get; set; }   // "ios" | "android"
    public PushProvider Provider { get; init; }
    public DateTime LastSeenAtUtc { get; set; }
    public DateTime? DisabledAtUtc { get; set; }    // Expo "cihaz kayıtlı değil" derse veya çıkış yapılırsa dolar
}