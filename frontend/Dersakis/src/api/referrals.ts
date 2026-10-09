import { api } from "./http";

export type Referral = {
  inviteCode: string;
  maxInvites: number;
  used: number;
  remaining: number;
  inviterReward: number;
  inviteeReward: number;
  invited: { displayName: string; joinedAtUtc: string }[];
};

export const fetchReferral = () => api<Referral>("/referrals/me");
