namespace Dersakis.Infrastructure.Services;

public sealed class QaSettings
{
    public int TextQuestionCost { get; init; } = 10;
    public int VoiceQuestionCost { get; init; } = 20;
    public int TextBestReward { get; init; } = 6;
    public int VoiceBestReward { get; init; } = 12;
    public bool VoiceEnabled { get; init; }                  // Agora hazır olana kadar kapalı
    public int BestAnswerWindowDays { get; init; } = 14;     // ilk cevaptan sonra soran seçmezse ilk cevaplayana verilir
    public int EditWindowSeconds { get; init; } = 120;
    public int MaxAnswersPerQuestion { get; init; } = 100;
    public string[] Categories { get; init; } = [];

    public QaSettings EnsureValid()
    {
        if (TextQuestionCost < 1 || VoiceQuestionCost < 1) throw new InvalidOperationException("Qa: soru fiyatları pozitif olmalı.");
        // Kredi enflasyonunu kapatan kural: ödül her zaman fiyattan küçük.
        if (TextBestReward < 1 || TextBestReward >= TextQuestionCost) throw new InvalidOperationException("Qa:TextBestReward, 1 ile TextQuestionCost-1 arasında olmalı.");
        if (VoiceBestReward < 1 || VoiceBestReward >= VoiceQuestionCost) throw new InvalidOperationException("Qa:VoiceBestReward, 1 ile VoiceQuestionCost-1 arasında olmalı.");
        if (BestAnswerWindowDays is < 1 or > 90) throw new InvalidOperationException("Qa:BestAnswerWindowDays 1-90 arasında olmalı.");
        if (EditWindowSeconds is < 10 or > 3600) throw new InvalidOperationException("Qa:EditWindowSeconds 10-3600 arasında olmalı.");
        if (MaxAnswersPerQuestion < 1) throw new InvalidOperationException("Qa:MaxAnswersPerQuestion en az 1 olmalı.");
        if (Categories.Length is < 1 or > 30
            || Categories.Any(c => string.IsNullOrWhiteSpace(c) || c.Length > 40)
            || Categories.Distinct(StringComparer.OrdinalIgnoreCase).Count() != Categories.Length)
            throw new InvalidOperationException("Qa:Categories 1-30 adet, benzersiz, en çok 40 karakterlik isim içermeli.");
        return this;
    }
}