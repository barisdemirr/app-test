import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { fetchRedemptions, fetchRewards, redeemReward } from "@/api/rewards";
import type { BalanceDto } from "@/api/credits";
import { useIdemAction } from "@/hooks/useIdemAction";
import { queryKeys } from "./keys";

export function useRewards() {
  return useQuery({ queryKey: queryKeys.rewards, queryFn: fetchRewards, staleTime: 0 });
}

export function useRedemptions() {
  return useInfiniteQuery({
    queryKey: queryKeys.redemptions,
    staleTime: 0,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchRedemptions(pageParam),
    getNextPageParam: (last, all) => (last.hasMore ? all.length + 1 : undefined),
  });
}

/** Satın alma: bakiye cevaptaki `balance` ile güncellenir; stok/limit için liste tazelenir. */
export function useRedeem() {
  const qc = useQueryClient();
  const act = useIdemAction((id: string, key) => redeemReward(id, key));
  return useMutation({
    mutationFn: act,
    onSuccess: (r) => {
      qc.setQueryData<BalanceDto>(queryKeys.balance, (b) =>
        b ? { ...b, balance: r.balance } : b,
      );
      qc.invalidateQueries({ queryKey: queryKeys.rewards });
      qc.invalidateQueries({ queryKey: queryKeys.redemptions });
    },
  });
}
