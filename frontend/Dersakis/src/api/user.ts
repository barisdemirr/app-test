import { DAILY_CAP, mockUser } from "@/mocks";
import type { UserProfile } from "@/types";
import { request } from "./client";

/**
 * Oturum açmış kullanıcı profili.
 * GET /me
 */
export async function fetchMe(): Promise<UserProfile> {
  return request<UserProfile>("/me", mockUser);
}

export type CreditsResult = {
  credits: number;
  earnedToday: number;
  dailyCap: number;
};

/**
 * Kredi kazan.
 * POST /me/credits
 *
 * Backend tavanı aşmaya izin vermez, tavanı da döner.
 */
export async function awardCredits(amount: number): Promise<CreditsResult> {
  const earned = Math.min(DAILY_CAP, mockUser.earnedToday + amount);
  const result: CreditsResult = {
    credits: mockUser.credits + amount,
    earnedToday: earned,
    dailyCap: DAILY_CAP,
  };
  return request<CreditsResult>(
    "/me/credits",
    result,
    { method: "POST" },
  );
}

/**
 * Profil güncelle.
 * PATCH /me
 */
export async function updateProfile(
  patch: Partial<Pick<UserProfile, "bio" | "name">>,
): Promise<UserProfile> {
  const updated: UserProfile = { ...mockUser, ...patch };
  return request<UserProfile>("/me", updated, { method: "PATCH" });
}