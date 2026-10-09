import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  bookLesson,
  cancelLive,
  createLessonListing,
  createVoiceListing,
  endLive,
  fetchLiveSession,
  fetchLiveSessions,
  reviewLive,
  type LiveScope,
} from "@/api/live";
import type { BalanceDto } from "@/api/credits";
import type { LiveKind, LiveSessionDto } from "@/api/types";
import { useIdemAction } from "@/hooks/useIdemAction";
import { pollInterval } from "@/utils/live";
import { queryKeys } from "./keys";

export function useLiveList(o: {
  kind?: LiveKind;
  scope: LiveScope;
  courseIds?: string[];
  enabled?: boolean;
  pageSize?: number;
  refetchMs?: number;
}) {
  const { kind, scope, courseIds, enabled = true, pageSize = 20, refetchMs } = o;
  return useInfiniteQuery({
    queryKey: queryKeys.liveList(kind ?? "all", scope, courseIds ?? []),
    enabled,
    staleTime: 0,
    refetchInterval: refetchMs,
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchLiveSessions({ kind, scope, courseIds, page: pageParam, pageSize }),
    getNextPageParam: (last, all) => (last.hasMore ? all.length + 1 : undefined),
  });
}

/** Tek oturum: duruma göre 3-10 sn'de bir yoklanır, sonuçlanınca durur. */
export function useLiveSession(id: string) {
  return useQuery({
    queryKey: queryKeys.liveSession(id),
    queryFn: () => fetchLiveSession(id),
    staleTime: 0,
    refetchInterval: (q) => pollInterval(q.state.data),
  });
}

/** Mutasyon sonrası ortak güncelleme: oturumu yaz, listeleri ve gerekirse bakiyeyi tazele. */
function useLiveSync() {
  const qc = useQueryClient();
  return (s: LiveSessionDto, balance?: number) => {
    qc.setQueryData(queryKeys.liveSession(s.id), s);
    qc.invalidateQueries({ queryKey: queryKeys.live });
    if (balance != null)
      qc.setQueryData<BalanceDto>(queryKeys.balance, (b) => (b ? { ...b, balance } : b));
    else qc.invalidateQueries({ queryKey: queryKeys.balance });
  };
}

export function useCreateVoice() {
  const sync = useLiveSync();
  const act = useIdemAction(
    (a: { courseId: string; title: string; description: string }, key) =>
      createVoiceListing(a, key),
  );
  return useMutation({ mutationFn: act, onSuccess: (r) => sync(r.session, r.balance) });
}

export function useCreateLesson() {
  const sync = useLiveSync();
  const act = useIdemAction(
    (
      a: {
        courseId: string;
        title: string;
        description: string;
        scheduledAt: string;
        durationMinutes: number;
        price: number;
      },
      key,
    ) => createLessonListing(a, key),
  );
  return useMutation({ mutationFn: act, onSuccess: (r) => sync(r.session) });
}

export function useBookLesson() {
  const sync = useLiveSync();
  const act = useIdemAction((id: string, key) => bookLesson(id, key));
  return useMutation({ mutationFn: act, onSuccess: (r) => sync(r.session, r.balance) });
}

export function useCancelLive() {
  const sync = useLiveSync();
  const act = useIdemAction((id: string, key) => cancelLive(id, key));
  return useMutation({ mutationFn: act, onSuccess: (s) => sync(s) });
}

export function useEndLive() {
  const sync = useLiveSync();
  return useMutation({ mutationFn: (id: string) => endLive(id), onSuccess: (s) => sync(s) });
}

/** Onayla / reddet ayrı anahtar kullanır: aynı anahtarla farklı gövde gönderilmesin. */
export function useReviewLive() {
  const sync = useLiveSync();
  const approve = useIdemAction((id: string, key) => reviewLive(id, true, key));
  const reject = useIdemAction((id: string, key) => reviewLive(id, false, key));
  return useMutation({
    mutationFn: (v: { id: string; approve: boolean }) =>
      v.approve ? approve(v.id) : reject(v.id),
    onSuccess: (r) => sync(r.session),
  });
}
