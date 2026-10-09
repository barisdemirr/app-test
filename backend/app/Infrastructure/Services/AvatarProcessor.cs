using SkiaSharp;

namespace Dersakis.Infrastructure.Services;

public static class AvatarProcessor
{
    public const int Size = 256;
    private const long MaxPixels = 16_000_000;   // decode bombasına karşı

    /// <summary>Geçerli bir JPEG/PNG/WebP ise 256x256 WebP baytlarını döner, değilse null.</summary>
    public static byte[]? TryProcess(Stream input)
    {
        try
        {
            using var codec = SKCodec.Create(input);
            if (codec is null) return null;
            if (codec.EncodedFormat is not (SKEncodedImageFormat.Jpeg or SKEncodedImageFormat.Png or SKEncodedImageFormat.Webp))
                return null;

            // Boyut, piksel verisi decode edilmeden önce kontrol edilir.
            var info = codec.Info;
            if (info.Width <= 0 || info.Height <= 0 || (long)info.Width * info.Height > MaxPixels) return null;

            var origin = codec.EncodedOrigin;
            using var decoded = SKBitmap.Decode(codec);
            if (decoded is null) return null;

            using var rotated = Rotate(decoded, origin);
            var upright = rotated ?? decoded;

            // Ortadan kare kırp ve 256x256'ya ölçekle
            var side = Math.Min(upright.Width, upright.Height);
            var left = (upright.Width - side) / 2f;
            var top = (upright.Height - side) / 2f;

            using var target = new SKBitmap(Size, Size);
            using (var canvas = new SKCanvas(target))
            using (var paint = new SKPaint { FilterQuality = SKFilterQuality.High, IsAntialias = true })
            {
                canvas.DrawBitmap(upright, new SKRect(left, top, left + side, top + side), new SKRect(0, 0, Size, Size), paint);
            }

            using var image = SKImage.FromBitmap(target);
            using var data = image.Encode(SKEncodedImageFormat.Webp, 85);
            return data?.ToArray();
        }
        catch (Exception)
        {
            return null; // bozuk dosya: istemciye "geçersiz görsel" denir
        }
    }

    /// <summary>EXIF yönüne göre döndürür. Yön normalse null döner. Aynalı yönler (nadir) desteklenmez.</summary>
    private static SKBitmap? Rotate(SKBitmap src, SKEncodedOrigin origin)
    {
        SKBitmap result;
        switch (origin)
        {
            case SKEncodedOrigin.BottomRight: // 180°
                result = new SKBitmap(src.Width, src.Height);
                using (var c = new SKCanvas(result)) { c.Translate(src.Width, src.Height); c.RotateDegrees(180); c.DrawBitmap(src, 0, 0); }
                return result;

            case SKEncodedOrigin.RightTop:    // 90° saat yönü (dik çekilmiş telefon fotoğrafı)
                result = new SKBitmap(src.Height, src.Width);
                using (var c = new SKCanvas(result)) { c.Translate(src.Height, 0); c.RotateDegrees(90); c.DrawBitmap(src, 0, 0); }
                return result;

            case SKEncodedOrigin.LeftBottom:  // 270° saat yönü
                result = new SKBitmap(src.Height, src.Width);
                using (var c = new SKCanvas(result)) { c.Translate(0, src.Width); c.RotateDegrees(270); c.DrawBitmap(src, 0, 0); }
                return result;

            default:
                return null;
        }
    }
}