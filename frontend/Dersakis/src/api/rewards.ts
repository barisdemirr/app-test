import { rewardsData } from "@/mocks";
import type { Reward } from "@/types";
import { request } from "./client";

/**
 * Ödül kataloğu.
 * GET /rewards
 */
export async function fetchRewards(): Promise<Reward[]> {
  return request<Reward[]>("/rewards", rewardsData);
}

export type RedeemResult = {
  ok: true;
  spent: number;
  remaining: number;
};

/**
 * Ödül kullan.
 * POST /rewards/:id/redeem
 */
export async function redeemReward(
  id: string,
  price: number,
  currentCredits: number,
): Promise<RedeemResult> {
  const result: RedeemResult = {
    ok: true,
    spent: price,
    remaining: currentCredits - price,
  };
  return request<RedeemResult>(
    `/rewards/${id}/redeem`,
    result,
    { method: "POST" },
  );
}