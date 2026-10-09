namespace Dersakis.Domain.Enums;

/// <summary>DB'de tinyint. Mevcut numaralar değişmez, sadece eklenir.</summary>
public enum VideoStatus : byte
{
    Draft = 1,      // metadata var, dosya henüz yüklenmedi
    Published = 2,
    Removed = 3     // moderasyon / silme (kayıt kalır, akıştan çıkar)
}