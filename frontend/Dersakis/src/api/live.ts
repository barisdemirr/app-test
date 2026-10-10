import { api as rawApi, qs, type RequestOptions } from "./http";
import type {
  AgoraDto,
  LiveKind,
  LiveOutcome,
  LiveSessionDto,
  LiveStatus,
  PagedList,
} from "./types";

const KIND_BY_NUM: Record<number, LiveKind> = { 1: "Voice", 2: "Lesson" };
const STATUS_BY_NUM: Record<number, LiveStatus> = {
  1: "Listed",
  2: "Open",
  3: "Booked",
  4: "Pending",
  5: "Waiting",
  6: "Live",
  7: "AwaitingApproval",
  8: "Completed",
  9: "Cancelled",
  10: "Expired",
};
const OUTCOME_BY_NUM: Record<number, LiveOutcome> = {
  0: "None",
  1: "Approved",
  2: "AutoApproved",
  3: "Rejected",
  4: "HostNoShow",
  5: "GuestNoShow",
  6: "BothNoShow",
  7: "NoGuest",
};

/**
 * Sunucu enum'ları bazı sürümlerde sayı (1, 2…) olarak gönderir; arayüz "Lesson", "Booked" gibi metin bekler.
 * Yanıttaki tüm oturum nesnelerini (liste, {session}, tekil) metne çevirir. Zaten metinse dokunmaz.
 */
function fixLive<T>(v: T): T {
  if (Array.isArray(v)) return v.map(fixLive) as unknown as T;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    if ("channelName" in o && "kind" in o) {
      if (typeof o.kind === "number") o.kind = KIND_BY_NUM[o.kind] ?? o.kind;
      if (typeof o.status === "number") o.status = STATUS_BY_NUM[o.status] ?? o.status;
      if (typeof o.outcome === "number") o.outcome = OUTCOME_BY_NUM[o.outcome] ?? o.outcome;
      return v;
    }
    for (const k of Object.keys(o)) o[k] = fixLive(o[k]);
  }
  return v;
}

const api = async <T = any>(path: string, o?: RequestOptions): Promise<T> => fixLive(await rawApi<T>(path, o));


export type LiveScope = "open" | "mine" | "active";

export type LiveListArgs = {
  kind?: LiveKind;
  scope: LiveScope;
  courseIds?: string[];
  page?: number;
  pageSize?: number;
};

export type LiveListResponse = PagedList<LiveSessionDto> & { serverNowUtc: string };

/**
 * GET /live/sessions. Ders filtresini biz ekleriz (courseIds ≤ 20).
 * open: satıştaki ilanlar (kendi ilanların çıkmaz) · mine: geçmiş dahil · active: yapılacak bir şeyin var.
 */
export const fetchLiveSessions = (a: LiveListArgs) =>
  api<LiveListResponse>(
    "/live/sessions" +
      qs({
        kind: a.kind,
        scope: a.scope,
        courseIds: a.courseIds,
        page: a.page ?? 1,
        pageSize: a.pageSize ?? 20,
      }),
  );

/** GET /live/{id} — bekleme ekranlarında 3-10 sn'de bir çağrılır (gerçek zamanlı kanal yok). */
export const fetchLiveSession = (id: string) => api<LiveSessionDto>(`/live/${id}`);

/** POST /live/voice (idem) — ilan açılırken `price` anında düşer (escrow). */
export const createVoiceListing = (
  body: { courseId: string; title: string; description: string },
  idemKey: string,
) =>
  api<{ session: LiveSessionDto; balance: number }>("/live/voice", {
    method: "POST",
    body,
    idemKey,
  });

/** POST /live/lessons (idem) — eğitmen kredi ödemez. scheduledAt Z'li ISO olmalı. */
export const createLessonListing = (
  body: {
    courseId: string;
    title: string;
    description: string;
    scheduledAt: string;
    durationMinutes: number;
    price: number;
  },
  idemKey: string,
) =>
  api<{ session: LiveSessionDto }>("/live/lessons", { method: "POST", body, idemKey });

/** POST /live/{id}/book (idem) — kredi anında escrow'a alınır. */
export const bookLesson = (id: string, idemKey: string) =>
  api<{ session: LiveSessionDto; balance: number }>(`/live/${id}/book`, {
    method: "POST",
    idemKey,
  });

/** POST /live/{id}/join — önce join, sonra Agora kanalına gir. Tekrarı güvenli, her seferinde yeni token. */
export const joinLive = (id: string) =>
  api<{ session: LiveSessionDto; agora: AgoraDto }>(`/live/${id}/join`, { method: "POST" });

/** POST /live/{id}/token — Agora onTokenPrivilegeWillExpire olayında. */
export const refreshLiveToken = (id: string) =>
  api<AgoraDto>(`/live/${id}/token`, { method: "POST" });

/** POST /live/{id}/end — Live → AwaitingApproval. Zaten bittiyse başarılı döner. */
export const endLive = (id: string) =>
  api<LiveSessionDto>(`/live/${id}/end`, { method: "POST" });

/** POST /live/{id}/review (idem) — yalnızca ödeyen taraf. false → ödeyene tam iade, karşı taraf kredi almaz. */
export const reviewLive = (id: string, approve: boolean, idemKey: string) =>
  api<{ session: LiveSessionDto }>(`/live/${id}/review`, {
    method: "POST",
    body: { approve },
    idemKey,
  });

/** POST /live/{id}/cancel (idem) — yalnızca ilan sahibi. */
export const cancelLive = (id: string, idemKey: string) =>
  api<LiveSessionDto>(`/live/${id}/cancel`, { method: "POST", idemKey });
