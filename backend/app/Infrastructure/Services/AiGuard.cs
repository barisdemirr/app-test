using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Dersakis.Infrastructure.Services;

/// <summary>
/// Dolphy için savunma katmanı. Modele giren her metin (kullanıcı mesajı, geçmiş, video/soru metinleri) ve
/// modelden çıkan her metin buradan geçer. Tek başına prompt'a güvenilmez; bu sınıf onu tamamlar.
/// </summary>
public static partial class AiGuard
{
    /// <summary>Sistem talimatına gömülen gizli işaret. Cevapta görünürse talimat sızmış demektir ve cevap atılır.</summary>
    public static readonly string Canary = "DX-" + Guid.NewGuid().ToString("N")[..14];

    // Sızıntı tespiti: talimatın kendine özgü ifadeleri cevapta geçmemeli.
    private static readonly string[] LeakMarkers =
    [
        "GÜVENLİK KURALLARI", "VERİ SONU", "GÜVENİLMEYEN", "systemInstruction", "responseSchema", "doğrulama kodu"
    ];

    [GeneratedRegex(@"https?://\S+|www\.\S+|\b[a-z0-9-]+\.(com|net|org|io|ru|xyz|tk|ly|me)\b\S*", RegexOptions.IgnoreCase)]
    private static partial Regex UrlPattern();

    [GeneratedRegex(@"\s+")]
    private static partial Regex Spaces();

    // Yalnızca günlük kaydı için: engellemez, saldırı denemesini görünür kılar.
    [GeneratedRegex(@"ignore (all |the )?(previous|above|prior)|system prompt|developer (message|mode)|jailbreak|\bDAN\b|önceki (tüm )?(talimat|kural)|sistem (prompt|talimat|mesaj)|kuralları (unut|yok say)|rol(ü)?n(ü)? (değiştir|unut)|prompt(unu|u)? (göster|yaz|paylaş)", RegexOptions.IgnoreCase)]
    private static partial Regex InjectionHint();

    public static bool LooksLikeInjection(string s) => InjectionHint().IsMatch(s);

    /// <summary>
    /// Kullanıcı mesajı: görünmez/yönlendirme karakterleri (sıfır genişlik, bidi) atılır, kontrol karakteri varsa reddedilir.
    /// Satır sonları korunur ama art arda en fazla iki.
    /// </summary>
    public static string? CleanUserText(string? raw, int maxChars)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;

        var sb = new StringBuilder(raw.Length);
        foreach (var c in raw.Normalize(NormalizationForm.FormKC))
        {
            var cat = char.GetUnicodeCategory(c);
            if (cat == UnicodeCategory.Format) continue;                       // sıfır genişlik, bidi, vb.
            if (c is '\n' or '\t') { sb.Append(c == '\t' ? ' ' : c); continue; }
            if (c == '\r') continue;
            if (char.IsControl(c)) return null;                                // null, escape vb.: reddet
            sb.Append(c);
        }

        var s = Regex.Replace(sb.ToString().Trim(), @"\n{3,}", "\n\n");
        if (s.Length == 0 || s.Length > maxChars) return null;
        return s;
    }

    /// <summary>
    /// Modele VERİ olarak giden metin (başkalarının yazdığı soru/video metinleri dahil). Satır sonları ve ayraç
    /// benzeri diziler (===, ```, ###) düzleştirilir ki veri bloğundan çıkıp talimat gibi görünemesin.
    /// </summary>
    public static string CleanData(string? raw, int maxChars)
    {
        if (string.IsNullOrEmpty(raw)) return "";
        var sb = new StringBuilder(raw.Length);
        foreach (var c in raw)
        {
            if (char.GetUnicodeCategory(c) == UnicodeCategory.Format) continue;
            sb.Append(char.IsControl(c) ? ' ' : c);
        }

        var s = sb.ToString().Replace("===", "-").Replace("```", "'").Replace("###", "#").Replace("<", "‹").Replace(">", "›");
        s = Spaces().Replace(s, " ").Trim();
        return s.Length <= maxChars ? s : s[..maxChars] + "…";
    }

    /// <summary>Model çıktısındaki metni temizler: bağlantılar kaldırılır, uzunluk sınırlanır, kontrol karakterleri atılır.</summary>
    public static string CleanOutput(string? raw, int maxChars)
    {
        if (string.IsNullOrEmpty(raw)) return "";
        var sb = new StringBuilder(raw.Length);
        foreach (var c in raw)
        {
            if (c is '\n') { sb.Append(c); continue; }
            if (char.GetUnicodeCategory(c) == UnicodeCategory.Format || char.IsControl(c)) continue;
            sb.Append(c);
        }

        var s = UrlPattern().Replace(sb.ToString(), "[bağlantı kaldırıldı]").Trim();
        s = Regex.Replace(s, @"\n{3,}", "\n\n");
        return s.Length <= maxChars ? s : s[..maxChars].TrimEnd() + "…";
    }

    /// <summary>Cevap sistem talimatını ele veriyor mu?</summary>
    public static bool Leaks(string text)
    {
        if (text.Contains(Canary, StringComparison.OrdinalIgnoreCase)) return true;
        foreach (var m in LeakMarkers)
            if (text.Contains(m, StringComparison.OrdinalIgnoreCase)) return true;
        return false;
    }
}
