namespace Dersakis.Domain.Entities;

public sealed class Reward : BaseEntity
{
    public required string Title { get; init; }
    public required string Description { get; init; }
    public required string Provider { get; init; }       // "Platform ödülü", "Örnek sponsor" gibi
    public int Cost { get; init; }
    public int? StockRemaining { get; set; }              // null = sınırsız. Yalnızca atomik UPDATE ile azalır.
    public int? PerUserLimit { get; init; }               // null = sınırsız
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; init; }
}