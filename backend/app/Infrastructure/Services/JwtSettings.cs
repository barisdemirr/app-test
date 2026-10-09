namespace Dersakis.Infrastructure.Services;

public sealed class JwtSettings
{
    public string Issuer { get; init; } = "";
    public string Audience { get; init; } = "";
    public string Key { get; init; } = "";
    public int AccessTokenMinutes { get; init; } = 720;

    /// <summary>Uygulama başlarken çağrılır. Eksik/zayıf ayar varsa uygulama hiç ayağa kalkmaz (fail-fast).</summary>
    public JwtSettings EnsureValid()
    {
        if (string.IsNullOrWhiteSpace(Issuer) || string.IsNullOrWhiteSpace(Audience))
            throw new InvalidOperationException("Jwt:Issuer ve Jwt:Audience tanımlı olmalı.");
        if (Key.Length < 32)
            throw new InvalidOperationException("Jwt:Key en az 32 karakter olmalı. user-secrets veya Jwt__Key ortam değişkeni kullan.");
        if (AccessTokenMinutes is < 5 or > 1440)
            throw new InvalidOperationException("Jwt:AccessTokenMinutes 5 ile 1440 arasında olmalı.");
        return this;
    }
}