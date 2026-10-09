using Dersakis.Domain.Enums;

namespace Dersakis.Domain.Entities;

/// <summary>
/// Kredi defteri: sadece EKLENİR, güncellenmez ve silinmez. Bakiye = bu tablodaki Amount toplamı olmalı.
/// Satırlar CreditService içinde ham SQL ile yazılır, bakiye değişimiyle aynı transaction'dadır.
/// </summary>
public sealed class CreditTransaction : BaseEntity
{
    public Guid UserId { get; init; }
    public int Amount { get; init; }          // kazanım +, harcama -
    public int BalanceAfter { get; init; }
    public CreditReason Reason { get; init; }
    public Guid RefId { get; init; }          // soru id'si, ödül id'si, kayıt bonusunda kullanıcı id'si
}