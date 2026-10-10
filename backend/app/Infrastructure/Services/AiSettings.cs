using System.Text.RegularExpressions;

namespace Dersakis.Infrastructure.Services;

/// <summary>
/// Dolphy (yapay zekâ çalışma koçu) ayarları. ApiKey asla repoya girmez:
/// dotnet user-secrets set "Ai:ApiKey" "..." ya da (git'e giren) appsettings.Development.json YERİNE ortam değişkeni Ai__ApiKey.
/// </summary>
public sealed partial class AiSettings
{
    public string ApiKey { get; init; } = "";
    public string Model { get; init; } = "gemini-3.5-flash-lite";
    public string BaseUrl { get; init; } = "https://generativelanguage.googleapis.com/v1beta";

    public double Temperature { get; init; } = 0.5;
    public int MaxOutputTokens { get; init; } = 2048;
    public int TimeoutSeconds { get; init; } = 25;

    public int MaxMessageChars { get; init; } = 500;      // kullanıcı mesajı
    public int MaxHistoryTurns { get; init; } = 8;        // modele giden en fazla geçmiş mesaj
    public int DailyMessageLimit { get; init; } = 40;     // kullanıcı başına gün (Türkiye saati) limiti
    public int ContextWrongAnswers { get; init; } = 8;    // bağlama giren son yanlış sayısı

    public bool Enabled => !string.IsNullOrWhiteSpace(ApiKey);

    [GeneratedRegex("^[A-Za-z0-9._-]{3,80}$")]
    private static partial Regex ModelFormat();

    public AiSettings EnsureValid()
    {
        if (!ModelFormat().IsMatch(Model)) throw new InvalidOperationException("Ai:Model geçersiz (yalnızca harf, rakam, '.', '-', '_').");
        if (!Uri.TryCreate(BaseUrl, UriKind.Absolute, out var u) || u.Scheme != Uri.UriSchemeHttps)
            throw new InvalidOperationException("Ai:BaseUrl https ile başlayan geçerli bir adres olmalı.");
        if (Temperature is < 0 or > 1.5) throw new InvalidOperationException("Ai:Temperature 0-1.5 arasında olmalı.");
        if (MaxOutputTokens is < 256 or > 8192) throw new InvalidOperationException("Ai:MaxOutputTokens 256-8192 arasında olmalı.");
        if (TimeoutSeconds is < 5 or > 120) throw new InvalidOperationException("Ai:TimeoutSeconds 5-120 arasında olmalı.");
        if (MaxMessageChars is < 20 or > 2000) throw new InvalidOperationException("Ai:MaxMessageChars 20-2000 arasında olmalı.");
        if (MaxHistoryTurns is < 1 or > 20) throw new InvalidOperationException("Ai:MaxHistoryTurns 1-20 arasında olmalı.");
        if (DailyMessageLimit < 1) throw new InvalidOperationException("Ai:DailyMessageLimit en az 1 olmalı.");
        if (ContextWrongAnswers is < 0 or > 20) throw new InvalidOperationException("Ai:ContextWrongAnswers 0-20 arasında olmalı.");
        return this;
    }
}
