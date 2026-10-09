import { api } from "./http";

export type VideoFlagKind = "save" | "learned";
export type VideoFlagResult = { videoId: string; kind: "Saved" | "Learned"; active: boolean };

/**
 * PUT|DELETE /videos/{id}/save  ve  /videos/{id}/learned
 * Tekrar çağırmak zararsızdır, Idempotency-Key gerekmez.
 * "Öğrendim" için videoyu bitirmiş olmak şart (watch_required), kendi videonda olmaz (own_video).
 */
export const setVideoFlag = (id: string, kind: VideoFlagKind, active: boolean) =>
  api<VideoFlagResult>(`/videos/${id}/${kind}`, { method: active ? "PUT" : "DELETE" });
