namespace Dersakis.Infrastructure.Services;

public sealed class ProfileSettings
{
    public int AboutMaxLength { get; init; } = 160;
    public int AvatarMaxBytes { get; init; } = 2 * 1024 * 1024;
    public string AvatarStorageRoot { get; init; } = "App_Data/avatars";
    public string[] Interests { get; init; } = [];   // boş varsayılan: config dizisi varsayılana eklenmesin

    public ProfileSettings EnsureValid()
    {
        if (AboutMaxLength is < 20 or > 500) throw new InvalidOperationException("Profile:AboutMaxLength 20-500 arasında olmalı.");
        if (AvatarMaxBytes is < 100_000 or > 10_000_000) throw new InvalidOperationException("Profile:AvatarMaxBytes 100 KB ile 10 MB arasında olmalı.");
        if (string.IsNullOrWhiteSpace(AvatarStorageRoot)) throw new InvalidOperationException("Profile:AvatarStorageRoot boş olamaz.");
        if (Interests.Length > 20
            || Interests.Any(i => string.IsNullOrWhiteSpace(i) || i.Length > 30)
            || Interests.Distinct(StringComparer.OrdinalIgnoreCase).Count() != Interests.Length)
            throw new InvalidOperationException("Profile:Interests en fazla 20 adet, benzersiz, en çok 30 karakterlik değer içermeli.");
        return this;
    }
}