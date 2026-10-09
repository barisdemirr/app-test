namespace Dersakis.Domain.Entities;

public sealed class User : BaseEntity
{
    public required string Email { get; set; }
    public required string NormalizedEmail { get; set; }
    public required string DisplayName { get; set; }
    public required string PasswordHash { get; set; }

    /// <summary>
    /// Bakiye SADECE kredi servisi üzerinden, atomik SQL ile değişir (Commit 4).
    /// private set: kod içinden yanlışlıkla "user.CreditBalance += x" yazılmasını derleme aşamasında engeller.
    /// EF Core private setter'ı kullanarak veriyi okuyabilir.
    /// </summary>
    public int CreditBalance { get; private set; }

    /// <summary>Bugün (Türkiye saatiyle) tavana sayılan kazanım. DailyEarnedDay bugün değilse geçersizdir.</summary>
    public int DailyEarned { get; private set; }
    public DateOnly? DailyEarnedDay { get; private set; }

    public int FailedLoginCount { get; set; }
    public DateTime? LockoutEndUtc { get; set; }

    public static string NormalizeEmail(string email) => email.Trim().ToUpperInvariant();
}