namespace Dersakis.Domain.Enums;

/// <summary>DB'de tinyint. Mevcut numaralar değişmez, sadece eklenir.</summary>
public enum WatchStatus : byte
{
    Active = 1,
    Completed = 2,
    Abandoned = 3
}