import { api } from "./http";

export type WatchStart = {
  /** alreadyCompleted ise null: heartbeat/complete gerekmez */
  sessionId: string | null;
  videoId: string;
  durationMs: number;
  watchedMs: number;
  alreadyCompleted: boolean;
  heartbeatIntervalMs: number;
};

export type WatchComplete = {
  sessionId: string;
  videoId: string;
  status: "Completed";
  alreadyCompleted: boolean;
};

/** POST /videos/{videoId}/watch-sessions — video görünür olup oynamaya başlayınca BİR kez. */
export const startWatch = (videoId: string) =>
  api<WatchStart>(`/videos/${videoId}/watch-sessions`, { method: "POST" });

/** POST /watch-sessions/{id}/heartbeat — oynarken her heartbeatIntervalMs'te; duraklatınca gönderme. */
export const sendHeartbeat = (sessionId: string, positionMs: number) =>
  api(`/watch-sessions/${sessionId}/heartbeat`, {
    method: "POST",
    body: { positionMs },
  });

/** POST /watch-sessions/{id}/complete — video bitince, positionMs = durationMs. */
export const completeWatch = (sessionId: string, positionMs: number) =>
  api<WatchComplete>(`/watch-sessions/${sessionId}/complete`, {
    method: "POST",
    body: { positionMs },
  });
