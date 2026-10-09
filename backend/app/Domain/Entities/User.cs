namespace Dersakis.Domain.Entities;

public sealed class User : BaseEntity
{
    public required string Phone { get; set; }            // E.164: +905XXXXXXXXX
    public required string DisplayName { get; set; }
    public required string PasswordHash { get; set; }

    /// <summary>
    /// Bakiye SADECE kredi servisi üzerinden, atomik SQL ile değişir.
    /// private set: kod içinden "user.CreditBalance += x" yazılması derleme aşamasında engellenir.
    /// </summary>
    public int CreditBalance { get; private set; }

    /// <summary>Bugün (Türkiye saatiyle) tavana sayılan kazanım. DailyEarnedDay bugün değilse geçersizdir.</summary>
    public int DailyEarned { get; private set; }
    public DateOnly? DailyEarnedDay { get; private set; }

    public required string InviteCode { get; init; }      // bu kullanıcının davet kodu
    public Guid? InvitedByUserId { get; init; }           // kimin koduyla kaydoldu
    public int InvitesUsed { get; private set; }          // kodunun kaç kez kullanıldığı (yalnızca atomik UPDATE ile artar)

    public int FailedLoginCount { get; set; }
    public DateTime? LockoutEndUtc { get; set; }
}