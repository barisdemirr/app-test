import { useCallback, useEffect, useRef, useState } from "react";
import { Linking } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { joinLive } from "@/api/live";
import { ApiError } from "@/api/http";
import { errorMessage } from "@/api/errors";
import { queryKeys } from "@/queries/keys";
import { AgoraUnavailableError, LiveCall } from "@/live/agora";
import { requestCallPermissions } from "@/live/permissions";

export type CallPhase = "idle" | "connecting" | "connected" | "failed";

export type CallFailure = {
  message: string;
  /** true: tekrar denemek anlamsız (süre doldu, oturum kapandı...) */
  fatal: boolean;
  needsSettings?: boolean;
};

const CONNECT_TIMEOUT_MS = 20_000;

/** Rapor 8.5: join hata kodları -> kullanıcı mesajı */
function mapJoinError(e: unknown): CallFailure {
  if (e instanceof AgoraUnavailableError) return { message: e.message, fatal: true };
  if (e instanceof ApiError) {
    switch (e.code) {
      case "agora_not_configured":
        return { message: "Görüşme şu an kullanılamıyor.", fatal: true };
      case "join_window_closed":
        return { message: "Süre doldu.", fatal: true };
      case "session_closed":
      case "session_taken":
      case "already_in_session":
      case "host_busy":
      case "waiting_for_guest":
      case "not_started_yet":
        return { message: e.message, fatal: true };
    }
    if (e.status >= 400 && e.status < 500) return { message: e.message, fatal: true };
  }
  return { message: errorMessage(e), fatal: false };
}

/**
 * Bir canlı oturumun sesli/görüntülü görüşmesini yönetir.
 * Sıra: izin -> POST /live/{id}/join -> Agora kanalı. Unmount'ta kanaldan ayrılır
 * (görüşmeyi BİTİRMEZ; bitirmek için `end` çağrılmalı).
 */
export function useLiveCall(sessionId: string, mediaType: "audio" | "video" | undefined) {
  const qc = useQueryClient();
  const callRef = useRef<LiveCall | null>(null);
  const runRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [phase, setPhase] = useState<CallPhase>("idle");
  const [failure, setFailure] = useState<CallFailure | null>(null);
  const [peerUid, setPeerUid] = useState<number | null>(null);
  const [peerLeft, setPeerLeft] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [speaker, setSpeaker] = useState(mediaType === "video");

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const stop = useCallback(() => {
    runRef.current++;
    clearTimer();
    callRef.current?.stop();
    callRef.current = null;
  }, []);

  const fail = useCallback(
    (run: number, f: CallFailure) => {
      if (run !== runRef.current) return;
      clearTimer();
      callRef.current?.stop();
      callRef.current = null;
      setFailure(f);
      setPhase("failed");
    },
    [],
  );

  const start = useCallback(async () => {
    if (!mediaType) return;
    stop();
    const run = ++runRef.current;
    setPhase("connecting");
    setFailure(null);
    setPeerUid(null);
    setPeerLeft(false);
    setReconnecting(false);
    setMuted(false);
    setCameraOff(false);
    setSpeaker(mediaType === "video");

    const ok = await requestCallPermissions(mediaType === "video");
    if (run !== runRef.current) return;
    if (!ok) {
      fail(run, {
        message:
          mediaType === "video"
            ? "Görüşme için mikrofon ve kamera izni gerekli."
            : "Görüşme için mikrofon izni gerekli.",
        fatal: false,
        needsSettings: true,
      });
      return;
    }

    try {
      const { session, agora } = await joinLive(sessionId);
      if (run !== runRef.current) return;
      qc.setQueryData(queryKeys.liveSession(sessionId), session);
      qc.invalidateQueries({ queryKey: queryKeys.live });

      const call = new LiveCall(sessionId, agora.mediaType);
      callRef.current = call;
      timerRef.current = setTimeout(
        () => fail(run, { message: "Bağlanılamadı. Tekrar dene.", fatal: false }),
        CONNECT_TIMEOUT_MS,
      );
      call.connect(agora, {
        onJoined: () => {
          if (run !== runRef.current) return;
          clearTimer();
          setPhase("connected");
        },
        onPeerJoined: (uid) => {
          if (run !== runRef.current) return;
          setPeerUid(uid);
          setPeerLeft(false);
        },
        onPeerLeft: () => {
          if (run !== runRef.current) return;
          setPeerUid(null);
          setPeerLeft(true);
        },
        onReconnecting: (r) => run === runRef.current && setReconnecting(r),
        onError: (message) => fail(run, { message, fatal: false }),
      });
    } catch (e) {
      fail(run, mapJoinError(e));
    }
  }, [mediaType, sessionId, qc, stop, fail]);

  // ekran açılınca bir kez başla; kapanınca kanaldan ayrıl
  const started = useRef(false);
  useEffect(() => {
    if (mediaType && !started.current) {
      started.current = true;
      void start();
    }
  }, [mediaType, start]);
  useEffect(() => stop, [stop]);

  return {
    phase,
    failure,
    peerUid,
    peerLeft,
    reconnecting,
    muted,
    cameraOff,
    speaker,
    retry: start,
    stop,
    openSettings: () => Linking.openSettings(),
    toggleMute: () => {
      const v = !muted;
      setMuted(v);
      callRef.current?.mute(v);
    },
    toggleCamera: () => {
      const v = !cameraOff;
      setCameraOff(v);
      callRef.current?.cameraOff(v);
    },
    toggleSpeaker: () => {
      const v = !speaker;
      setSpeaker(v);
      callRef.current?.speaker(v);
    },
    switchCamera: () => callRef.current?.switchCamera(),
  };
}
