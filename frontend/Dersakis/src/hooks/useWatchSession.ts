import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/api/http";
import {
  completeWatch,
  sendHeartbeat,
  startWatch,
  type WatchStart,
} from "@/api/watch";

/** Hızlı kaydırarak geçilen videolarda gereksiz oturum açılmasın */
const START_DELAY_MS = 600;
const DEFAULT_HEARTBEAT_MS = 5000;

type Options = {
  videoId: string;
  /** Feed'deki watchCompleted: true ise oturum hiç açılmaz */
  alreadyCompleted: boolean;
  /** Kart aktif (görünür) ve uygulama ön planda mı */
  enabled: boolean;
  /** Oynatıcı şu an oynuyor mu (duraklatınca heartbeat gönderilmez) */
  playing: boolean;
  getPositionMs: () => number;
  onCompleted: () => void;
  /** 409 watch_incomplete */
  onIncomplete: () => void;
};

/**
 * İzleme oturumu: start (bir kez) → heartbeat (oynarken) → complete (video bitince).
 * Sunucu izlenen süreyi gerçek geçen süreyle doğrular; ileri sarmak süre kazandırmaz.
 */
export function useWatchSession(o: Options) {
  const [completed, setCompleted] = useState(o.alreadyCompleted);
  const sessionRef = useRef<WatchStart | null>(null);
  const optsRef = useRef(o);
  optsRef.current = o;

  useEffect(() => {
    if (o.alreadyCompleted) setCompleted(true);
  }, [o.alreadyCompleted]);

  const start = useCallback(async (): Promise<WatchStart | null> => {
    const res = await startWatch(optsRef.current.videoId);
    sessionRef.current = res;
    if (res.alreadyCompleted) {
      setCompleted(true);
      optsRef.current.onCompleted();
    }
    return res;
  }, []);

  // 1) start: görünür olunca, kısa gecikmeyle, bir kez
  useEffect(() => {
    if (!o.enabled || completed) return;
    if (sessionRef.current) return;
    const t = setTimeout(() => {
      start().catch(() => {
        // ağ hatası: heartbeat/complete sırasında yeniden denenecek
      });
    }, START_DELAY_MS);
    return () => clearTimeout(t);
  }, [o.enabled, completed, start]);

  // 2) heartbeat: yalnızca oynarken
  useEffect(() => {
    if (!o.enabled || completed || !o.playing) return;
    const every = sessionRef.current?.heartbeatIntervalMs ?? DEFAULT_HEARTBEAT_MS;
    const id = setInterval(async () => {
      const s = sessionRef.current;
      if (!s?.sessionId) return;
      try {
        await sendHeartbeat(s.sessionId, optsRef.current.getPositionMs());
      } catch (e) {
        if (
          e instanceof ApiError &&
          (e.code === "session_not_active" || e.code === "session_expired")
        ) {
          sessionRef.current = null;
          start().catch(() => {});
        }
        // rate_limited / ağ hatası: bir sonraki tikte devam
      }
    }, every);
    return () => clearInterval(id);
  }, [o.enabled, completed, o.playing, start]);

  // 3) complete: video bitince
  const complete = useCallback(async () => {
    if (completed) return;
    const run = async (retry: boolean): Promise<void> => {
      let s = sessionRef.current;
      if (!s) s = await start();
      if (!s || s.alreadyCompleted || !s.sessionId) return;
      try {
        await completeWatch(s.sessionId, s.durationMs);
        setCompleted(true);
        optsRef.current.onCompleted();
      } catch (e) {
        if (e instanceof ApiError) {
          if (e.code === "watch_incomplete") return optsRef.current.onIncomplete();
          if (
            retry &&
            (e.code === "session_not_active" || e.code === "session_expired")
          ) {
            sessionRef.current = null;
            return run(false);
          }
        }
        throw e;
      }
    };
    await run(true);
  }, [completed, start]);

  return { completed, complete };
}
