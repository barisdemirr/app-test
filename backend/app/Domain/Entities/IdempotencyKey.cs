namespace Dersakis.Domain.Entities;

/// <summary>
/// Tamamlanmış bir mutasyon isteğinin kaydı. Satır, işin kendisiyle AYNI transaction'da yazılır,
/// bu yüzden "iş yapıldı ama kayıt yok" ya da tersi bir durum oluşamaz.
/// </summary>
public sealed class IdempotencyKey : BaseEntity
{
    public Guid UserId { get; init; }
    public required string Key { get; init; }
    public required byte[] RequestHash { get; init; }   // SHA-256(method + path + body)
    public int StatusCode { get; set; }
    public string? ContentType { get; set; }
    public byte[]? ResponseBody { get; set; }
}