namespace Dersakis.Infrastructure.Services;

public sealed class CreditSettings
{
    public int QuizReward { get; init; } = 5;
    public int DailyCap { get; init; } = 60;

    /// <summary>Uygulama açılırken çağrılır. Mantıksız ayar varsa uygulama hiç başlamaz.</summary>
    public CreditSettings EnsureValid()
    {
        if (QuizReward <= 0) throw new InvalidOperationException("Credits:QuizReward pozitif olmalı.");
        if (DailyCap < QuizReward) throw new InvalidOperationException("Credits:DailyCap, QuizReward değerinden küçük olamaz.");
        return this;
    }
}