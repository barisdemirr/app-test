namespace Dersakis.Domain.Enums;

/// <summary>DB'de tinyint, yalnızca eklenir.</summary>
public enum NotificationType : byte
{
    VoiceGuestJoined = 1,      // host'a: misafir katıldı, süre işliyor
    VoiceHostMissed = 2,       // misafire: host gelmedi, oturum iptal
    VoiceExpired = 3,          // host'a: kimse katılmadı, iade edildi
    LessonBooked = 4,          // eğitmene: öğrenci satın aldı
    LessonStarting = 5,        // ikisine: randevu vakti geldi
    LessonCancelled = 6,       // iptal ve iade
    ApprovalRequested = 7,     // ödeyene: memnun kaldın mı?
    SessionSettled = 8,        // kazanana/ödeyene: ödeme veya iade sonucu
    Test = 9
}

/// <summary>Push gönderim durumu. 0 = bekliyor, bu yüzden varsayılan satır doğrudan kuyruğa girer.</summary>
public enum PushDelivery : byte { Pending = 0, Sent = 1, Skipped = 2, Failed = 3, Expired = 4 }

public enum PushProvider : byte { Expo = 1 }