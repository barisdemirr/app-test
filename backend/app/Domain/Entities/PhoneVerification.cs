namespace Dersakis.Domain.Entities;

public sealed class PhoneVerification : BaseEntity
{
    public required string Phone { get; init; }          // E.164
    public required byte[] CodeHash { get; init; }       // HMAC-SHA256, düz kod saklanmaz
    public DateTime ExpiresAtUtc { get; init; }
    public int Attempts { get; set; }
    public DateTime? ConsumedAtUtc { get; set; }         // kullanıldı veya iptal edildi
}