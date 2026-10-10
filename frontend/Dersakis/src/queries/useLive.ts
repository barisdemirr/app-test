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
  type LiveListResponse,
  type LiveScope,
} from "@/api/live";
import type { BalanceDto } from "@/api/credits";
import type { LiveKind, LiveSessionDto } from "@/api/types";
import { useIdemAction } from "@/hooks/useIdemAction";
import { pollInterval } from "@/utils/live";
import { toDate } from "@/utils/time";
import { queryKeys } from "./keys";

export function useLiveList(o: {
  kind?: LiveKind;
  scope: LiveScope;
  courseIds?: string[];
  enabled?: boolean;
  pageSize?: number;
  /** Sabit aralık ya da veriye göre hesaplanan aralık (ms). Ekran açıkken kendiliğinden yenilenir. */
  refetchMs?: number | ((items: LiveSessionDto[]) => number | false);
}) {
  const { kind, scope, courseIds, enabled = true, pageSize = 20, refetchMs } = o;
  return useInfiniteQuery({
    queryKey: queryKeys.liveList(kind ?? "all", scope, courseIds ?? []),
    enabled,
    staleTime: 0,
    refetchInterval:
      typeof refetchMs === "function"
        ? (q: { state: { data?: { pages: LiveListResponse[] } } }) =>
            refetchMs((q.state.data?.pages ?? []).flatMap((pg) => pg.items))
        : refetchMs,
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


/** Yapılacak bir şeyi olan oturumlar. Yaklaşan/açık bir görüşme varsa sık yoklar (Katıl kaçmasın). */
export function activeRefetchMs(items: LiveSessionDto[]): number {
  const now = Date.now();
  let ms = 15_000;
  for (const s of items) {
    if (s.canJoin || s.status === "Pending" || s.status === "Waiting" || s.status === "Live") ms = Math.min(ms, 3_000);
    else if (s.status === "Booked" && s.scheduledAtUtc) {
      const left = toDate(s.scheduledAtUtc).getTime() - now;
      if (left < 150_000) ms = Math.min(ms, 2_500);
      else if (left < 900_000) ms = Math.min(ms, 8_000);
    } else if (s.status === "AwaitingApproval") ms = Math.min(ms, 8_000);
  }
  return ms;
}

export function useActiveSessions(enabled = true) {
  return useLiveList({ scope: "active", pageSize: 20, enabled, refetchMs: activeRefetchMs });
}
