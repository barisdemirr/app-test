using System.Security.Cryptography;

namespace Dersakis.Infrastructure.Services;

public sealed class AvatarStorage
{
    private readonly string _root;

    public AvatarStorage(ProfileSettings settings, IHostEnvironment env)
    {
        _root = Path.GetFullPath(Path.Combine(env.ContentRootPath, settings.AvatarStorageRoot));
        Directory.CreateDirectory(_root);
    }

    /// <summary>Her yükleme benzersiz bir dosya adı alır: paralel iki yükleme birbirinin dosyasını ezemez.</summary>
    public (string Relative, string Full) NewPath(Guid userId)
    {
        var suffix = Convert.ToHexString(RandomNumberGenerator.GetBytes(6)).ToLowerInvariant();
        var relative = $"{userId:N}-{suffix}.webp";
        return (relative, Path.GetFullPath(Path.Combine(_root, relative)));
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
        catch { /* silinemeyen dosya kritik değil, yetim kalır */ }
    }
}