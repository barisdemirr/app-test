namespace Dersakis.Domain.Entities;

/// <summary>Kullanıcının çalıştığı ders (tercih).</summary>
public sealed class UserCourse
{
    public Guid UserId { get; init; }
    public Guid CourseId { get; init; }
}