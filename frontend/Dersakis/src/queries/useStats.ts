import { useQuery } from "@tanstack/react-query";
import { fetchStats } from "@/api/stats";
import { queryKeys } from "./keys";

export function useStats() {
  return useQuery({ queryKey: queryKeys.stats, queryFn: fetchStats });
}
