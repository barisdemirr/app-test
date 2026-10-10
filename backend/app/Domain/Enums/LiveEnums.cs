using System.Text.Json.Serialization;

namespace Dersakis.Domain.Enums;

/// <summary>API'de metin olarak ("Voice", "Lesson") gider; DB'de sayı kalır.</summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum LiveKind : byte { Voice = 1, Lesson = 2 }

/// <summary>DB'de tinyint. Mevcut numaralar değişmez, sadece eklenir. Pending/Waiting/Live "aktif" sayılır.</summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum LiveStatus : byte
{
    Listed = 1,            // eğitim ilanı, henüz satın alınmadı
    Open = 2,              // sesli ilan, misafir bekliyor
    Booked = 3,            // eğitim satın alındı, randevu bekliyor
    Pending = 4,           // sesli: misafir katıldı, host'un gelme süresi işliyor
    Waiting = 5,           // eğitim: vakit geldi, katılım penceresi işliyor
    Live = 6,
    AwaitingApproval = 7,  // görüşme bitti, ödeyen onaylayacak
    Completed = 8,         // ödeme yapıldı
    Cancelled = 9,         // iptal ve iade
    Expired = 10           // süresi doldu (ilan, kimse katılmadı)
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum LiveOutcome : byte
{
    None = 0, Approved = 1, AutoApproved = 2, Rejected = 3,
    HostNoShow = 4,    // host (sesli: soran, eğitim: eğitmen) gelmedi
    GuestNoShow = 5,   // misafir (eğitim: öğrenci) gelmedi
    BothNoShow = 6, NoGuest = 7
}