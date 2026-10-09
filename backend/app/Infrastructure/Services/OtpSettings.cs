namespace Dersakis.Infrastructure.Services;

public sealed class OtpSettings
{
    public int CodeTtlSeconds { get; init; } = 300;    // kodun geçerlilik süresi
    public int ResendSeconds { get; init; } = 60;      // aynı numaraya iki kod arası en az
    public int MaxPerHour { get; init; } = 5;          // aynı numaraya saatte en fazla kod (SMS maliyeti ve taciz koruması)
    public int MaxAttempts { get; init; } = 5;         // bir koda en fazla deneme

    public OtpSettings EnsureValid()
    {
        if (CodeTtlSeconds is < 60 or > 1800) throw new InvalidOperationException("Otp:CodeTtlSeconds 60-1800 arasında olmalı.");
        if (ResendSeconds is < 10 or > 600) throw new InvalidOperationException("Otp:ResendSeconds 10-600 arasında olmalı.");
        if (MaxPerHour < 1) throw new InvalidOperationException("Otp:MaxPerHour en az 1 olmalı.");
        if (MaxAttempts is < 1 or > 10) throw new InvalidOperationException("Otp:MaxAttempts 1-10 arasında olmalı.");
        return this;
    }
}