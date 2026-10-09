using System.Security.Cryptography;

namespace Dersakis.Shared;

public static class InviteCodes
{
    // 0/O, 1/I/L gibi karışan karakterler yok. 31^8 ihtimal, tahmin edilemez.
    private const string Alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

    public static string Generate() => RandomNumberGenerator.GetString(Alphabet, 8);

    /// <summary>Boş girdi geçerlidir (davet kodu yok, code = null). Biçim bozuksa false döner.</summary>
    public static bool TryNormalize(string? input, out string? code)
    {
        code = null;
        var s = new string((input ?? "").Where(c => c is not (' ' or '-')).ToArray()).ToUpperInvariant();
        if (s.Length == 0) return true;
        if (s.Length != 8 || s.Any(c => !Alphabet.Contains(c))) return false;
        code = s;
        return true;
    }
}