import { useQuery } from "@tanstack/react-query";
import { fetchBalance } from "@/api/credits";
import { queryKeys } from "./keys";

/** Bakiye tek anahtarda tutulur; cevaplardaki `balance` setQueryData ile buraya yazılır. */
export function useBalance() {
  return useQuery({
    queryKey: queryKeys.balance, queryFn: fetchBalance, staleTime: 0,
    // iade, otomatik onay, kazanç gibi arka plan değişiklikleri kendiliğinden görünsün
    refetchInterval: 30_000,
  });
}
