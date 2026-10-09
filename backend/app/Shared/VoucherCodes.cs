using System.Security.Cryptography;

namespace Dersakis.Shared;

public static class VoucherCodes
{
    // 0/O, 1/I/L gibi karışan karakterler yok. 31^12 ihtimal, tahmin edilemez.
    private const string Alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

    public static string Generate() => RandomNumberGenerator.GetString(Alphabet, 12);

    /// <summary>Gösterim için: ABCDEFGHJKMN -> ABCD-EFGH-JKMN</summary>
    public static string Format(string code) => $"{code[..4]}-{code[4..8]}-{code[8..]}";
}