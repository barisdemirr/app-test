namespace Dersakis.Domain.Entities;

/// <summary>Bir kullanıcının bir soruya verdiği TEK cevap. Satır sonradan değişmez.</summary>
public sealed class QuizAttempt : BaseEntity
{
    public Guid UserId { get; init; }
    public Guid QuestionId { get; init; }
    public Guid VideoId { get; init; }            // istatistik (ders/konu bazlı) için
    public Guid SelectedOptionId { get; init; }
    public bool IsCorrect { get; init; }
    public int CreditAwarded { get; init; }
}