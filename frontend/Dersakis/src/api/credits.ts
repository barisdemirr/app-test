import { api } from "./http";

export type BalanceDto = {
  balance: number;
  dailyEarned: number;
  dailyCap: number;
  dailyRemaining: number;
};

/** GET /credits/balance — kredi yalnızca sunucudan gelir, istemci hesaplamaz. */
export const fetchBalance = () => api<BalanceDto>("/credits/balance");
