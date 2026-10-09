namespace Dersakis.Shared;

public static class TextRules
{
    /// <summary>Kontrol karakteri (null vb.) içeren metni reddeder. allowNewlines ile satır sonu ve sekme serbest.</summary>
    public static bool Clean(string s, bool allowNewlines = false)
        => s.All(c => !char.IsControl(c) || (allowNewlines && c is '\n' or '\r' or '\t'));

    /// <summary>Satır sonlarını \n'e çevirir, baş ve sondaki boşlukları atar.</summary>
    public static string Normalize(string? s) => (s ?? "").Replace("\r\n", "\n").Replace('\r', '\n').Trim();
}