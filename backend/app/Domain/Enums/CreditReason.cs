namespace Dersakis.Domain.Enums;

/// <summary>DB'de tinyint olarak saklanır. Mevcut değerlerin numarası ASLA değiştirilmez, sadece yenisi eklenir.</summary>
public enum CreditReason : byte
{
    SignupBonus = 1,
    QuizCorrect = 2,
    RewardRedeem = 3
}