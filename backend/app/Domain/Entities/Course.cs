namespace Dersakis.Domain.Entities;

public sealed class Course : BaseEntity
{
    public required string Name { get; set; }
    public required string Slug { get; set; }
    public int SortOrder { get; set; }
}