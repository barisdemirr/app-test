namespace Dersakis.Domain.Entities;

/// <summary>Bir ödül alımı. Satır değişmez. Kupon kodu teslimatta kullanılır.</summary>
public sealed class RewardRedemption : BaseEntity
{
    public Guid UserId { get; init; }
    public Guid RewardId { get; init; }
    public required string Code { get; init; }            // 12 karakter, tire olmadan
    public int Cost { get; init; }                        // alındığı andaki fiyat
}