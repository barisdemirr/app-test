/** CreditReason → Türkçe metin (rapor 5.3). Bilinmeyen kodlar ham gösterilir. */
const LABELS: Record<string, string> = {
  QuizCorrect: "Doğru cevap",
  QaQuestionSpend: "Soru sordun",
  QaBestAnswer: "Cevabın en iyi seçildi",
  QaQuestionRefund: "Cevapsız soru iadesi",
  ReferralInviter: "Arkadaşın davetinle katıldı",
  ReferralInvitee: "Davetle katıldın",
  RewardRedeem: "Ödül aldın",
  LiveVoiceSpend: "Sesli soru ilanı açtın",
  LiveVoiceReward: "Sesli soruyu cevaplayıp kazandın",
  LiveVoiceRefund: "Sesli soru iadesi",
  LiveLessonPurchase: "Eğitim satın aldın",
  LiveLessonEarning: "Eğitim verip kazandın",
  LiveLessonRefund: "Eğitim iadesi",
};

export const creditReasonLabel = (reason: string): string => LABELS[reason] ?? reason;
