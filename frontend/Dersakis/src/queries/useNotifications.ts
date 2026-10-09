import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { fetchNotifications, markNotificationsRead } from "@/api/notifications";
import { queryKeys } from "./keys";

/** Çan rozeti: yalnızca unreadCount için 1 kayıtlık sayfa; dakikada bir ve öne gelince tazelenir. */
export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.notificationsBadge,
    queryFn: () => fetchNotifications(1, 1),
    select: (d) => d.unreadCount,
    refetchInterval: 60_000,
  });
}

export function useNotifications(enabled = true) {
  return useInfiniteQuery({
    queryKey: queryKeys.notificationsList,
    enabled,
    staleTime: 0,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchNotifications(pageParam),
    getNextPageParam: (last, all) => (last.hasMore ? all.length + 1 : undefined),
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}
