using Dersakis.Domain.Enums;

namespace Dersakis.Domain.Entities;

/// <summary>
/// Canlı görüşme oturumu. Agora kanal adı = Id.
/// Roller: Voice'ta host soran (öder), misafir cevaplayan (kazanır). Lesson'da host eğitmen (kazanır), misafir öğrenci (öder).
/// Durum alanları yalnızca koşullu UPDATE ile değişir (private set: bellekte yanlışlıkla değiştirilemez).
/// </summary>
public sealed class LiveSession : BaseEntity
{
    public LiveKind Kind { get; private set; }
    public LiveStatus Status { get; private set; }
    public LiveOutcome Outcome { get; private set; }

    public Guid HostId { get; private set; }
    public Guid? GuestId { get; private set; }
    public Guid CourseId { get; private set; }
    public string Title { get; private set; } = "";
    public string Description { get; private set; } = "";

    public int Price { get; private set; }          // ödeyenden tutulan miktar
    public int Payout { get; private set; }         // kazanana geçecek miktar (sesli: ödül, eğitim: fiyatın tamamı)
    public int EscrowCredits { get; private set; }  // şu an session'da tutulan kredi, ödeme/iade sonrası 0

    public DateTime? ScheduledAtUtc { get; private set; }   // yalnızca eğitim
    public int? DurationMinutes { get; private set; }       // yalnızca eğitim

    public DateTime? JoinDeadlineUtc { get; private set; }
    public DateTime? ApprovalDeadlineUtc { get; private set; }
    public DateTime? HostJoinedAtUtc { get; private set; }
    public DateTime? GuestJoinedAtUtc { get; private set; }
    public DateTime? LiveStartedAtUtc { get; private set; }
    public DateTime? EndedAtUtc { get; private set; }
    public DateTime? SettledAtUtc { get; private set; }

    /// <summary>Arka plan job'ının bu satıra bakacağı an. Sonlanmış oturumlarda null.</summary>
    public DateTime? DueAtUtc { get; private set; }

    /// <summary>Krediyi ödeyen taraf. Yalnızca bellekte kullan, sorgularda değil.</summary>
    public Guid? PayerId => Kind == LiveKind.Voice ? HostId : GuestId;

    /// <summary>Krediyi kazanan taraf. Yalnızca bellekte kullan, sorgularda değil.</summary>
    public Guid? EarnerId => Kind == LiveKind.Voice ? GuestId : HostId;

    public static LiveSession NewVoice(
        Guid id, DateTime now, Guid hostId, Guid courseId, string title, string description,
        int price, int reward, TimeSpan expiry)
        => new()
        {
            Id = id,
            CreatedAtUtc = now,
            Kind = LiveKind.Voice,
            Status = LiveStatus.Open,
            HostId = hostId,
            CourseId = courseId,
            Title = title,
            Description = description,
            Price = price,
            Payout = reward,
            EscrowCredits = price,   // kredi, ilan açılırken session'a alınır
            DueAtUtc = now + expiry
        };

    public static LiveSession NewLesson(
        Guid id, DateTime now, Guid hostId, Guid courseId, string title, string description,
        int price, DateTime scheduledAtUtc, int durationMinutes)
        => new()
        {
            Id = id,
            CreatedAtUtc = now,
            Kind = LiveKind.Lesson,
            Status = LiveStatus.Listed,
            HostId = hostId,
            CourseId = courseId,
            Title = title,
            Description = description,
            Price = price,
            Payout = price,
            EscrowCredits = 0,        // öğrenci satın alınca dolar
            ScheduledAtUtc = scheduledAtUtc,
            DurationMinutes = durationMinutes,
            DueAtUtc = scheduledAtUtc                                // satılmazsa başlangıçta Expired olur
        };
}