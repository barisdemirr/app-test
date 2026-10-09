namespace Dersakis.Domain.Entities;

public abstract class BaseEntity
{
    // Version 7 GUID: zaman sıralı, clustered index'te sayfa bölünmesini azaltır.
    public Guid Id { get; init; } = Guid.CreateVersion7();
    public DateTime CreatedAtUtc { get; init; } = DateTime.UtcNow;
}