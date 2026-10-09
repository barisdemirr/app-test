namespace Dersakis.Domain.Entities;

public abstract class BaseEntity
{
    // İstemci tarafında üretilir (INSERT öncesi Id bilinir). Not: SQL Server GUID'leri son baytlardan
    // sıraladığı için v7 burada sıralı ekleme garantisi vermez; amaç sadece benzersizlik ve öngörülemezlik.
    public Guid Id { get; init; } = Guid.CreateVersion7();
    
    public DateTime CreatedAtUtc { get; init; } = DateTime.UtcNow;
}