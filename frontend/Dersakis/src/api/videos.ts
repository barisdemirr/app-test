import { api } from "./http";
import { uploadRaw } from "./upload";

export type VideoFlagKind = "save" | "learned";
export type VideoFlagResult = { videoId: string; kind: "Saved" | "Learned"; active: boolean };

/**
 * PUT|DELETE /videos/{id}/save  ve  /videos/{id}/learned
 * Tekrar çağırmak zararsızdır, Idempotency-Key gerekmez.
 * "Öğrendim" için videoyu bitirmiş olmak şart (watch_required), kendi videonda olmaz (own_video).
 */
export const setVideoFlag = (id: string, kind: VideoFlagKind, active: boolean) =>
  api<VideoFlagResult>(`/videos/${id}/${kind}`, { method: active ? "PUT" : "DELETE" });

export type NewVideoQuestion = {
  text: string;
  correctAnswer: string;
  wrongAnswers: string[];
  explanation: string;
};

export type NewVideo = {
  courseId: string;
  title: string;
  topic: string;
  questions: NewVideoQuestion[];
};

export type VideoDraft = { id: string; status: "Draft"; uploadUrl: string };
export type VideoPublished = {
  id: string;
  status: "Published";
  durationMs: number;
  alreadyPublished: boolean;
};

/** POST /videos (Idempotency-Key zorunlu) — taslak + sorular. Yükleme adım 2'dedir. */
export const createVideoDraft = (body: NewVideo, idemKey: string) =>
  api<VideoDraft>("/videos", { method: "POST", body, idemKey });

/**
 * PUT /videos/{id}/content — ham MP4. Cevap kaybolursa aynı PUT'u tekrarlamak güvenlidir
 * (alreadyPublished: true döner).
 */
export const uploadVideoContent = (
  id: string,
  fileUri: string,
  onProgress?: (ratio: number) => void,
) => uploadRaw<VideoPublished>(`/videos/${id}/content`, fileUri, "video/mp4", onProgress);
