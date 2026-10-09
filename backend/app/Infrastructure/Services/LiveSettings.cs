namespace Dersakis.Infrastructure.Services;

/// <summary>Canlı görüşme (sesli Bilene sor + randevulu eğitim) ayarları. Miktar ve süreler appsettings'ten gelir.</summary>
public sealed class LiveSettings
{
    // Sesli: host soruyu açar ve öder, misafir cevaplar ve kazanır.
    public int VoiceCost { get; init; } = 20;
    public int VoiceReward { get; init; } = 12;
    public int VoiceHostJoinWindowSeconds { get; init; } = 120;   // misafir katılınca host'un gelme süresi
    public int VoiceMaxDurationMinutes { get; init; } = 15;
    public int VoiceOpenExpiryDays { get; init; } = 14;           // misafir çıkmazsa ilan kapanır, host'a iade
    public int MaxOpenVoiceListingsPerUser { get; init; } = 3;

    // Eğitim: fiyatı eğitmen belirler, sınırlar burada.
    public int LessonMinPrice { get; init; } = 10;
    public int LessonMaxPrice { get; init; } = 500;
    public int LessonMinDurationMinutes { get; init; } = 15;
    public int LessonMaxDurationMinutes { get; init; } = 90;
    public int LessonMinLeadMinutes { get; init; } = 30;          // ilan, başlangıçtan en az bu kadar önce açılır
    public int LessonMaxLeadDays { get; init; } = 30;
    public int LessonJoinWindowMinutes { get; init; } = 5;        // randevu vakti gelince katılma süresi
    public int MaxOpenLessonListingsPerUser { get; init; } = 10;

    // Ortak
    public int ApprovalWindowHours { get; init; } = 48;           // ödeyen cevap vermezse otomatik onay
    public int TokenGraceMinutes { get; init; } = 10;             // Agora token ömrüne eklenen pay
    public int JobIntervalSeconds { get; init; } = 15;

    public LiveSettings EnsureValid()
    {
        static void Range(string name, int value, int min, int max)
        {
            if (value < min || value > max)
                throw new InvalidOperationException($"Live:{name} {min}-{max} arasında olmalı.");
        }

        Range(nameof(VoiceCost), VoiceCost, 1, 1000);
        Range(nameof(VoiceReward), VoiceReward, 1, 1000);
        if (VoiceReward >= VoiceCost)
            throw new InvalidOperationException("Live:VoiceReward, Live:VoiceCost'tan küçük olmalı.");
        Range(nameof(VoiceHostJoinWindowSeconds), VoiceHostJoinWindowSeconds, 30, 900);
        Range(nameof(VoiceMaxDurationMinutes), VoiceMaxDurationMinutes, 1, 120);
        Range(nameof(VoiceOpenExpiryDays), VoiceOpenExpiryDays, 1, 60);
        Range(nameof(MaxOpenVoiceListingsPerUser), MaxOpenVoiceListingsPerUser, 1, 20);

        Range(nameof(LessonMinPrice), LessonMinPrice, 1, 10_000);
        Range(nameof(LessonMaxPrice), LessonMaxPrice, 1, 10_000);
        if (LessonMinPrice > LessonMaxPrice)
            throw new InvalidOperationException("Live:LessonMinPrice, Live:LessonMaxPrice'tan büyük olamaz.");
        Range(nameof(LessonMinDurationMinutes), LessonMinDurationMinutes, 5, 240);
        Range(nameof(LessonMaxDurationMinutes), LessonMaxDurationMinutes, 5, 240);
        if (LessonMinDurationMinutes > LessonMaxDurationMinutes)
            throw new InvalidOperationException("Live:LessonMinDurationMinutes, Live:LessonMaxDurationMinutes'ten büyük olamaz.");
        Range(nameof(LessonMinLeadMinutes), LessonMinLeadMinutes, 1, 1440);
        Range(nameof(LessonMaxLeadDays), LessonMaxLeadDays, 1, 90);
        Range(nameof(LessonJoinWindowMinutes), LessonJoinWindowMinutes, 1, 30);
        Range(nameof(MaxOpenLessonListingsPerUser), MaxOpenLessonListingsPerUser, 1, 50);

        Range(nameof(ApprovalWindowHours), ApprovalWindowHours, 1, 336);
        Range(nameof(TokenGraceMinutes), TokenGraceMinutes, 1, 60);
        Range(nameof(JobIntervalSeconds), JobIntervalSeconds, 5, 300);
        return this;
    }
}