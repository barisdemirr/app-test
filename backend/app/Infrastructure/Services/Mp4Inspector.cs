using System.Buffers.Binary;
using System.Text;

namespace Dersakis.Infrastructure.Services;

public static class Mp4Inspector
{
    private readonly record struct Box(string Type, long PayloadStart, long End);

    /// <summary>
    /// true: dosya eksiksiz bir MP4 ve süresi okundu. Codec (H.264 vb.) doğrulanmaz.
    /// Parçalı (fragmented) MP4'te mvhd süresi 0 olduğu için bu dosyalar reddedilir.
    /// </summary>
    public static bool TryReadDuration(Stream s, out int durationMs)
    {
        durationMs = 0;
        if (!s.CanSeek) return false;

        var length = s.Length;
        long pos = 0;
        var first = true;
        var found = false;

        // Üst sınır: bozuk dosyada sonsuz döngüye karşı.
        for (var i = 0; i < 1000 && pos < length; i++)
        {
            if (!TryReadHeader(s, pos, length, out var box)) return false;
            if (first && box.Type != "ftyp") return false;
            first = false;

            if (box.Type == "moov" && !found)
                found = TryReadMvhd(s, box.PayloadStart, box.End, out durationMs);

            pos = box.End;
        }

        // Kutular dosya sonuna tam oturmalı: kesilmiş yüklemeyi (mdat yarım) burada yakalarız.
        return found && pos == length;
    }

    private static bool TryReadMvhd(Stream s, long start, long end, out int durationMs)
    {
        durationMs = 0;
        long pos = start;

        while (pos < end)
        {
            if (!TryReadHeader(s, pos, end, out var box)) return false;

            if (box.Type == "mvhd")
            {
                var need = (int)Math.Min(32, box.End - box.PayloadStart);
                Span<byte> buf = stackalloc byte[32];
                s.Position = box.PayloadStart;
                if (s.ReadAtLeast(buf[..need], need, throwOnEndOfStream: false) != need) return false;

                uint timescale;
                ulong duration;
                switch (buf[0]) // sürüm
                {
                    case 0 when need >= 20: // sürüm 0: oluşturma(4) değiştirme(4) ölçek(4) süre(4)
                        timescale = BinaryPrimitives.ReadUInt32BigEndian(buf.Slice(12));
                        duration = BinaryPrimitives.ReadUInt32BigEndian(buf.Slice(16));
                        break;
                    case 1 when need >= 32: // sürüm 1: oluşturma(8) değiştirme(8) ölçek(4) süre(8)
                        timescale = BinaryPrimitives.ReadUInt32BigEndian(buf.Slice(20));
                        duration = BinaryPrimitives.ReadUInt64BigEndian(buf.Slice(24));
                        break;
                    default:
                        return false;
                }

                if (timescale == 0) return false;
                var ms = duration * 1000.0 / timescale;
                if (ms <= 0 || ms > int.MaxValue) return false;

                durationMs = (int)Math.Round(ms);
                return true;
            }

            pos = box.End;
        }

        return false;
    }

    private static bool TryReadHeader(Stream s, long pos, long limit, out Box box)
    {
        box = default;
        if (pos + 8 > limit) return false;

        Span<byte> h = stackalloc byte[8];
        s.Position = pos;
        if (s.ReadAtLeast(h, 8, throwOnEndOfStream: false) != 8) return false;

        long size = BinaryPrimitives.ReadUInt32BigEndian(h);
        var type = Encoding.ASCII.GetString(h.Slice(4, 4));
        long header = 8;

        if (size == 1) // 64 bit boyut: tipin ardından 8 bayt daha
        {
            if (pos + 16 > limit) return false;
            Span<byte> big = stackalloc byte[8];
            if (s.ReadAtLeast(big, 8, throwOnEndOfStream: false) != 8) return false;
            var large = BinaryPrimitives.ReadUInt64BigEndian(big);
            if (large > long.MaxValue) return false;
            size = (long)large;
            header = 16;
        }
        else if (size == 0) // 0: kutu dosya sonuna kadar uzanır
        {
            size = limit - pos;
        }

        if (size < header || pos + size > limit) return false;

        box = new Box(type, pos + header, pos + size);
        return true;
    }
}