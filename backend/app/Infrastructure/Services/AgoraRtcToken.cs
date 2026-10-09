using System.Buffers.Binary;
using System.IO.Compression;
using System.Security.Cryptography;
using System.Text;

namespace Dersakis.Infrastructure.Services;

/// <summary>
/// Agora AccessToken2 ("007") için RTC token üreticisi.
/// Agora'nın .NET için resmi kütüphanesi yok. Bu sınıf, resmi agora-token (Node) paketinin çıktısıyla
/// bayt bayt doğrulanmış algoritmanın portudur: SelfCheck(), sabit zaman ve salt ile resmi kütüphanenin
/// ürettiği baytlarla karşılaştırır.
/// </summary>
public static class AgoraRtcToken
{
    private const ushort RtcServiceType = 1;
    private const ushort PrivJoinChannel = 1;
    private const ushort PrivPublishAudio = 2;
    private const ushort PrivPublishVideo = 3;
    private const long MinLifetimeSeconds = 60;
    private const long MaxLifetimeSeconds = 24 * 3600; // Agora: bir yetki en fazla 24 saat geçerli

    /// <summary>
    /// Bir kullanıcı için tek kanala girebilen token üretir. Kanal adı oturum Id'si, hesap kullanıcı Id'sidir (string uid).
    /// video = false: yalnızca ses yayını yetkisi, true: ses + video.
    /// </summary>
    public static string Build(AgoraSettings cfg, string channel, string account, bool video, TimeSpan lifetime, TimeProvider clock)
    {
        if (!cfg.IsConfigured) throw new InvalidOperationException("Agora ayarları eksik.");

        var seconds = (uint)Math.Clamp((long)lifetime.TotalSeconds, MinLifetimeSeconds, MaxLifetimeSeconds);
        var issueTs = (uint)clock.GetUtcNow().ToUnixTimeSeconds();
        var salt = (uint)RandomNumberGenerator.GetInt32(1, 100_000_000);

        var payload = BuildPayload(cfg.AppId, cfg.AppCertificate, channel, account, video, issueTs, seconds, salt);
        return "007" + Convert.ToBase64String(Compress(payload));
    }

    /// <summary>Token'ın zlib öncesi içeriği: paketlenmiş imza + imzalanan bilgi.</summary>
    internal static byte[] BuildPayload(
        string appId, string certificate, string channel, string account, bool video, uint issueTs, uint expire, uint salt)
    {
        var channelBytes = Encoding.UTF8.GetBytes(channel);
        var accountBytes = Encoding.UTF8.GetBytes(account);
        if (channelBytes.Length is 0 or >= 64) throw new ArgumentException("Kanal adı 1-63 bayt olmalı.", nameof(channel));
        if (accountBytes.Length is 0 or > 255) throw new ArgumentException("Hesap adı 1-255 bayt olmalı.", nameof(account));

        // 1) İmzalama anahtarı: iki adımlı HMAC-SHA256. Önce anahtar = üretim zamanı, sonra anahtar = salt.
        var key = HMACSHA256.HashData(LeBytes(issueTs), Encoding.UTF8.GetBytes(certificate));
        key = HMACSHA256.HashData(LeBytes(salt), key);

        // 2) İmzalanacak bilgi. Tüm sayılar little-endian, metinler uint16 uzunluk + bayt.
        using var info = new MemoryStream();
        WriteString(info, Encoding.UTF8.GetBytes(appId));
        WriteUInt32(info, issueTs);
        WriteUInt32(info, expire);   // token'ın geçerlilik süresi (üretimden itibaren saniye)
        WriteUInt32(info, salt);
        WriteUInt16(info, 1);        // servis sayısı: yalnızca RTC

        WriteUInt16(info, RtcServiceType);
        WriteUInt16(info, (ushort)(video ? 3 : 2)); // yetki sayısı
        // Yetkiler anahtar sırasıyla yazılır. Değer, üretimden itibaren saniye cinsinden geçerlilik süresidir.
        WriteUInt16(info, PrivJoinChannel); WriteUInt32(info, expire);
        WriteUInt16(info, PrivPublishAudio); WriteUInt32(info, expire);
        if (video) { WriteUInt16(info, PrivPublishVideo); WriteUInt32(info, expire); }
        WriteString(info, channelBytes);
        WriteString(info, accountBytes);

        var infoBytes = info.ToArray();
        var signature = HMACSHA256.HashData(key, infoBytes);

        using var payload = new MemoryStream();
        WriteString(payload, signature);
        payload.Write(infoBytes);
        return payload.ToArray();
    }

    // Resmi agora-token paketiyle (sabit zaman 1700000000, salt 123456, süre 3600) üretilen beklenen içerikler.
    private const string VoicePayloadHex =
        "20000f0742cb158d62242166672504ad1c5c45ffd1b4ad17fbf3cbb56c8c4cb0b2a32000393730636133356465363063343436343562626165386132313530363162333300f15365100e000040e201000100010002000100100e00000200100e000020003062316530303033303030303430303038303030303030303030303030303031240030623165303030312d303030302d343030302d383030302d303030303030303030303031";

    private const string LessonPayloadHex =
        "20001156ab7100ca61e709f18ea4fb4589f6ad9499e1e85be148ccb14fecbd74289b2000393730636133356465363063343436343562626165386132313530363162333300f15365100e000040e201000100010003000100100e00000200100e00000300100e000020003062316530303033303030303430303038303030303030303030303030303031240030623165303030312d303030302d343030302d383030302d303030303030303030303031";

    /// <summary>Geliştirme açılışında çağrılır. false ise token kodu resmi algoritmayla uyuşmuyor demektir.</summary>
    public static bool SelfCheck()
    {
        const string appId = "970ca35de60c44645bbae8a215061b33";
        const string certificate = "5cfd2fd1755d40ecb72977518be15d3b";
        const string channel = "0b1e0003000040008000000000000001";
        const string account = "0b1e0001-0000-4000-8000-000000000001";

        var voice = BuildPayload(appId, certificate, channel, account, false, 1_700_000_000, 3600, 123_456);
        var lesson = BuildPayload(appId, certificate, channel, account, true, 1_700_000_000, 3600, 123_456);

        if (!string.Equals(Convert.ToHexString(voice), VoicePayloadHex, StringComparison.OrdinalIgnoreCase)) return false;
        if (!string.Equals(Convert.ToHexString(lesson), LessonPayloadHex, StringComparison.OrdinalIgnoreCase)) return false;

        // Sıkıştırma gidiş-dönüş: açılan içerik, sıkıştırılandan farklı olmamalı.
        return Decompress(Compress(lesson)).AsSpan().SequenceEqual(lesson);
    }

    private static byte[] Compress(byte[] data)
    {
        using var output = new MemoryStream();
        using (var zlib = new ZLibStream(output, CompressionLevel.Optimal, leaveOpen: true))
            zlib.Write(data);
        return output.ToArray();
    }

    private static byte[] Decompress(byte[] data)
    {
        using var input = new MemoryStream(data);
        using var zlib = new ZLibStream(input, CompressionMode.Decompress);
        using var output = new MemoryStream();
        zlib.CopyTo(output);
        return output.ToArray();
    }

    private static byte[] LeBytes(uint value)
    {
        var bytes = new byte[4];
        BinaryPrimitives.WriteUInt32LittleEndian(bytes, value);
        return bytes;
    }

    private static void WriteUInt16(Stream s, ushort value)
    {
        Span<byte> b = stackalloc byte[2];
        BinaryPrimitives.WriteUInt16LittleEndian(b, value);
        s.Write(b);
    }

    private static void WriteUInt32(Stream s, uint value)
    {
        Span<byte> b = stackalloc byte[4];
        BinaryPrimitives.WriteUInt32LittleEndian(b, value);
        s.Write(b);
    }

    private static void WriteString(Stream s, ReadOnlySpan<byte> value)
    {
        WriteUInt16(s, checked((ushort)value.Length));
        s.Write(value);
    }
}