namespace Dersakis.Domain.Entities;

/// <summary>"Biliyor muydun?" kartları için seçilen ilgi alanı.</summary>
public sealed class UserInterest
{
    public Guid UserId { get; init; }
    public required string Interest { get; init; }
}