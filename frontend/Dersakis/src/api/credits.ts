import { api, qs } from "./http";

export type BalanceDto = {
  balance: number;
  dailyEarned: number;
  dailyCap: number;
  dailyRemaining: number;
};

/** GET /credits/balance — kredi yalnızca sunucudan gelir, istemci hesaplamaz. */
export const fetchBalance = () => api<BalanceDto>("/credits/balance");

export type CreditReason =
  | "QuizCorrect"
  | "QaQuestionSpend"
  | "QaBestAnswer"
  | "QaQuestionRefund"
  | "ReferralInviter"
  | "ReferralInvitee"
  | "RewardRedeem"
  | "LiveVoiceSpend"
  | "LiveVoiceReward"
  | "LiveVoiceRefund"
  | "LiveLessonPurchase"
  | "LiveLessonEarning"
  | "LiveLessonRefund";

export type CreditEntry = {
  /** Negatifse harcama */
  amount: number;
  balanceAfter: number;
  reason: CreditReason | string;
  createdAtUtc: string;
};

/** GET /credits/history — sayfa tabanlı (page, pageSize). */
export const fetchCreditHistory = (page: number, pageSize = 20) =>
  api<{ items: CreditEntry[]; hasMore: boolean }>(
    "/credits/history" + qs({ page, pageSize }),
  );
