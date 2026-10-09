namespace Dersakis.Infrastructure.Services;

public sealed class RewardSettings
{
    public int MinAccountAgeHours { get; init; } = 24;     // hesap en az bu kadar eski olmalı
    public int MaxRedemptionsPerDay { get; init; } = 3;    // Türkiye saatiyle günlük ödül alma sınırı

    public RewardSettings EnsureValid()
    {
        if (MinAccountAgeHours is < 0 or > 720) throw new InvalidOperationException("Rewards:MinAccountAgeHours 0-720 arasında olmalı.");
        if (MaxRedemptionsPerDay is < 1 or > 50) throw new InvalidOperationException("Rewards:MaxRedemptionsPerDay 1-50 arasında olmalı.");
        return this;
    }
}