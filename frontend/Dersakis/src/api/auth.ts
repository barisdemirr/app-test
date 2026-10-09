import { api } from "./http";

export type AuthUser = {
  id: string;
  phone: string;
  displayName: string;
  creditBalance: number;
  inviteCode: string;
};

export type AuthResponse = {
  accessToken: string;
  expiresAtUtc: string;
  user: AuthUser;
};

export type RequestCodeResult = {
  expiresInSeconds: number;
  resendAfterSeconds: number;
  /** Yalnızca geliştirmede dolu; canlıda null. Arayüzde gösterme. */
  devCode: string | null;
};

export type RegisterInput = {
  phone: string;
  code: string;
  password: string;
  displayName: string;
  inviteCode?: string;
};

/** POST /auth/phone/request-code (anonim) */
export const requestPhoneCode = (phone: string) =>
  api<RequestCodeResult>("/auth/phone/request-code", {
    method: "POST",
    body: { phone },
  });

/** POST /auth/register (anonim) */
export const registerUser = (input: RegisterInput) =>
  api<AuthResponse>("/auth/register", {
    method: "POST",
    body: { ...input, inviteCode: input.inviteCode || undefined },
  });

/** POST /auth/login (anonim) */
export const loginUser = (phone: string, password: string) =>
  api<AuthResponse>("/auth/login", {
    method: "POST",
    body: { phone, password },
  });

/** GET /auth/me */
export const fetchMe = () => api<AuthUser>("/auth/me");
