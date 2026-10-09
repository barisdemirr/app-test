namespace Dersakis.Shared;

public static class PhoneNumber
{
    /// <summary>Türkiye cep numarasını E.164 biçimine çevirir: +905XXXXXXXXX. Geçersizse null.</summary>
    public static string? Normalize(string? input)
    {
        if (string.IsNullOrWhiteSpace(input) || input.Length > 25) return null;
        var s = input.Trim();
        if (s.Any(c => !(char.IsAsciiDigit(c) || c is ' ' or '-' or '(' or ')' or '+'))) return null;
        if (s.LastIndexOf('+') > 0) return null; // '+' yalnızca başta olabilir

        var d = new string(s.Where(char.IsAsciiDigit).ToArray());
        if (d.StartsWith("0090") && d.Length == 14) d = d[2..];            // 0090 5xx...
        else if (d.StartsWith('0') && d.Length == 11) d = "90" + d[1..];   // 05xx...
        else if (d.Length == 10) d = "90" + d;                             // 5xx...

        return d.Length == 12 && d.StartsWith("905") ? "+" + d : null;
    }
}