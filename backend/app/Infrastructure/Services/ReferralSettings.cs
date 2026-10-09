namespace Dersakis.Infrastructure.Services;

public sealed class ReferralSettings
{
    public int MaxInvitesPerUser { get; init; } = 3;
    public int InviterReward { get; init; } = 20;   // davet eden, her davet için bir kez
    public int InviteeReward { get; init; } = 20;   // davetle kaydolan, bir kez

    public ReferralSettings EnsureValid()
    {
        if (MaxInvitesPerUser is < 1 or > 100) throw new InvalidOperationException("Referral:MaxInvitesPerUser 1-100 arasında olmalı.");
        if (InviterReward < 1 || InviteeReward < 1) throw new InvalidOperationException("Referral: ödüller pozitif olmalı.");
        return this;
    }
}