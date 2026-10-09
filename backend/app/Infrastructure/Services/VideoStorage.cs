using System.Globalization;
using System.Security.Cryptography;

namespace Dersakis.Infrastructure.Services;

public sealed class VideoStorage
{
    private readonly string _root;

    public VideoStorage(VideoSettings settings, IHostEnvironment env)
    {
        // StorageRoot mutlak yol verilirse (prod için) Path.Combine onu olduğu gibi kullanır.
        _root = Path.GetFullPath(Path.Combine(env.ContentRootPath, settings.StorageRoot));
        Directory.CreateDirectory(_root);
    }

    /// <summary>Her yükleme denemesi benzersiz bir dosya adı alır: iki paralel deneme birbirinin dosyasını ezemez/silemez.</summary>
    public (string Relative, string Full) NewPath(Guid videoId, DateTime utcNow)
    {
        var year = utcNow.ToString("yyyy", CultureInfo.InvariantCulture);
        var month = utcNow.ToString("MM", CultureInfo.InvariantCulture);
        var suffix = Convert.ToHexString(RandomNumberGenerator.GetBytes(6)).ToLowerInvariant();

        var relative = $"{year}/{month}/{videoId:N}-{suffix}.mp4";
        var full = Path.GetFullPath(Path.Combine(_root, relative));
        Directory.CreateDirectory(Path.GetDirectoryName(full)!);
        return (relative, full);
    }

    /// <summary>DB'deki göreli yolu gerçek yola çevirir; kök klasörün dışına çıkıyorsa null döner.</summary>
    public string? Resolve(string relative)
    {
        var full = Path.GetFullPath(Path.Combine(_root, relative));
        return full.StartsWith(_root + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase) ? full : null;
    }

    public void TryDelete(string fullPath)
    {
        try { File.Delete(fullPath); }
        catch { /* silinemeyen dosya kritik değil, yetim dosya olarak kalır */ }
    }
}