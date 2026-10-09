using Dersakis.Domain.Enums;

namespace Dersakis.Domain.Entities;

public sealed class QaQuestion : BaseEntity
{
    public Guid AuthorId { get; init; }
    public required string Category { get; init; }
    public required string Topic { get; init; }          // serbest metin, boş olabilir
    public required string Text { get; init; }
    public QaMode Mode { get; init; }

    // Soru açıldığı andaki fiyat ve ödül: config sonradan değişse de bu sorunun şartları sabit kalır.
    public int Cost { get; init; }
    public int Reward { get; init; }

    // Aşağıdakiler yalnızca kilit altında/atomik UPDATE ile değişir.
    public int AnswerCount { get; set; }
    public DateTime? FirstAnswerAtUtc { get; set; }
    public Guid? BestAnswerId { get; set; }              // bilerek FK yok: döngüsel bağımlılık, kod kilit altında yazar
    public DateTime? BestChosenAtUtc { get; set; }
    public QaChosenBy? BestChosenBy { get; set; }

    public long Seq { get; private set; }                // sequence'ten, liste sıralaması ve cursor için
}