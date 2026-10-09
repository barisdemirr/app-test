import { api, qs } from "./http";

export type RewardItem = {
  id: string;
  title: string;
  description: string;
  provider: string;
  cost: number;
  /** null = sınırsız */
  stockRemaining: number | null;
  perUserLimit: number;
  redeemedByMe: number;
  /** false: stok bitti ya da kişi limiti doldu → düğme pasif */
  available: boolean;
};

export type RewardsResponse = {
  items: RewardItem[];
  eligibility: {
    /** Doluysa yeni hesap bekleme süresi: bu zamandan önce ödül alınamaz */
    eligibleAtUtc: string | null;
    dailyLimit: number;
    redeemedToday: number;
  };
  serverNowUtc: string;
};

export type RedeemResult = {
  redemptionId: string;
  rewardId: string;
  title: string;
  /** XXXX-XXXX-XXXX kupon kodu; teslimat sistem dışıdır, kodla yapılır */
  code: string;
  cost: number;
  balance: number;
  createdAtUtc: string;
};

export type Redemption = {
  id: string;
  rewardId: string;
  title: string;
  provider: string;
  code: string;
  cost: number;
  createdAtUtc: string;
};

export const fetchRewards = () => api<RewardsResponse>("/rewards");

/** POST /rewards/{id}/redeem (idem, gövde yok). */
export const redeemReward = (id: string, idemKey: string) =>
  api<RedeemResult>(`/rewards/${id}/redeem`, { method: "POST", idemKey });

/** GET /rewards/redemptions — "Aldığım ödüller"; kodu kaybeden buradan görür. Sayfa tabanlı. */
export const fetchRedemptions = (page: number, pageSize = 10) =>
  api<{ items: Redemption[]; hasMore: boolean }>(
    "/rewards/redemptions" + qs({ page, pageSize }),
  );
