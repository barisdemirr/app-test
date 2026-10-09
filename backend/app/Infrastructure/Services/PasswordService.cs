using Dersakis.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace Dersakis.Infrastructure.Services;

public sealed class PasswordService
{
    private static readonly User Placeholder = new()
    {
        Phone = "",
        DisplayName = "",
        PasswordHash = "",
        InviteCode = ""
    };

    private readonly PasswordHasher<User> _hasher = new();
    private readonly string _dummyHash;

    public PasswordService()
    {
        // Rastgele bir şifrenin hash'i: kullanıcı bulunamadığında bile aynı maliyetli doğrulama çalışsın diye.
        _dummyHash = _hasher.HashPassword(Placeholder, Guid.NewGuid().ToString("N"));
    }

    public string Hash(string password) => _hasher.HashPassword(Placeholder, password);

    /// <summary>hash null ise (kullanıcı yok) sahte hash ile doğrular: sonuç her zaman Failed, süre gerçek doğrulamayla aynı.</summary>
    public PasswordVerificationResult Verify(string? hash, string password)
        => _hasher.VerifyHashedPassword(Placeholder, hash ?? _dummyHash, password);
}