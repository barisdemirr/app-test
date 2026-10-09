namespace Dersakis.Domain.Enums;

/// <summary>DB'de tinyint olarak saklanır. Mevcut değerlerin numarası ASLA değiştirilmez, sadece yenisi eklenir.</summary>
public enum CreditReason : byte
{
    SignupBonus = 1,        // artık verilmiyor, numara rezerve
    QuizCorrect = 2,
    RewardRedeem = 3,
    QaQuestionSpend = 4,
    QaBestAnswer = 5,
    QaQuestionRefund = 6,
    ReferralInviter = 7,
    ReferralInvitee = 8,
    LiveVoiceSpend = 9,
    LiveVoiceReward = 10,
    LiveVoiceRefund = 11,
    LiveLessonPurchase = 12,
    LiveLessonEarning = 13,
    LiveLessonRefund = 14
}