/**
 * Agora motor sarmalayıcısı (rapor bölüm 8).
 *
 * - `react-native-agora` ağır bir native modüldür ve Expo Go'da yoktur; bu yüzden
 *   ilk kullanımda `require` ile yüklenir. Modül yoksa uygulama çökmez, kullanıcıya
 *   "geliştirme derlemesi gerekli" hatası gösterilir.
 * - Aynı anda yalnızca BİR LiveCall örneği yaşar (rapor 8.4/7).
 * - Çıkışta (onSignOut) motor kapatılır.
 */
import type { IRtcEngine } from "react-native-agora";
import { onSignOut } from "@/auth/session";
import { refreshLiveToken } from "@/api/live";
import type { AgoraDto } from "@/api/types";

export type CallEvents = {
  onJoined: () => void;
  onPeerJoined: (uid: number) => void;
  onPeerLeft: (uid: number) => void;
  /** reconnecting: true = Agora yeniden bağlanıyor */
  onReconnecting: (reconnecting: boolean) => void;
  onError: (message: string) => void;
};

export class AgoraUnavailableError extends Error {
  constructor() {
    super("Görüşme için geliştirme derlemesi (development build) gerekli; Expo Go desteklemiyor.");
    this.name = "AgoraUnavailableError";
  }
}

/** react-native-agora modülünü güvenle yükler (Expo Go'da null döner). */
export function loadAgora(): typeof import("react-native-agora") | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("react-native-agora");
  } catch {
    return null;
  }
}

let active: LiveCall | null = null;

export class LiveCall {
  private engine?: IRtcEngine;
  private handler?: object;
  private stopped = false;

  constructor(
    readonly sessionId: string,
    readonly mediaType: "audio" | "video",
  ) {}

  /** `join` cevabındaki agora bilgisiyle kanala girer. Hata olursa fırlatır. */
  connect(agora: AgoraDto, ev: CallEvents) {
    active?.stop();
    active = this;

    const A = loadAgora();
    if (!A) throw new AgoraUnavailableError();

    const video = agora.mediaType === "video";
    const engine = (this.engine = A.createAgoraRtcEngine());
    engine.initialize({
      appId: agora.appId,
      channelProfile: A.ChannelProfileType.ChannelProfileCommunication,
    });

    if (video) {
      engine.enableVideo();
      engine.setVideoEncoderConfiguration({
        dimensions: { width: 1280, height: 720 },
        frameRate: 15,
        bitrate: 0,
      });
      engine.startPreview();
    } else {
      engine.disableVideo();
    }
    engine.enableAudio();

    const renew = async () => {
      try {
        const t = await refreshLiveToken(this.sessionId);
        if (!this.stopped) engine.renewToken(t.token);
      } catch {
        if (!this.stopped) ev.onError("Bağlantı yenilenemedi.");
      }
    };

    const handler = {
      onJoinChannelSuccess: () => {
        engine.setEnableSpeakerphone(video);
        ev.onJoined();
      },
      onUserJoined: (_c: unknown, uid: number) => ev.onPeerJoined(uid),
      onUserOffline: (_c: unknown, uid: number) => ev.onPeerLeft(uid),
      onConnectionStateChanged: (_c: unknown, state: number) => {
        // 4 = Reconnecting, 3 = Connected, 5 = Failed
        if (state === 4) ev.onReconnecting(true);
        else if (state === 3) ev.onReconnecting(false);
        else if (state === 5) ev.onError("Bağlantı koptu.");
      },
      onError: (code: number, msg: string) => ev.onError(`Görüşme hatası (${code}) ${msg ?? ""}`.trim()),
      onTokenPrivilegeWillExpire: renew,
      onRequestToken: renew,
    };
    this.handler = handler;
    engine.registerEventHandler(handler);

    const r = engine.joinChannelWithUserAccount(agora.token, agora.channelName, agora.uid, {
      clientRoleType: A.ClientRoleType.ClientRoleBroadcaster,
      publishMicrophoneTrack: true,
      publishCameraTrack: video,
      autoSubscribeAudio: true,
      autoSubscribeVideo: video,
    });
    if (r < 0) {
      this.stop();
      throw new Error(`Kanala girilemedi (${r}).`);
    }
  }

  mute(muted: boolean) {
    this.engine?.muteLocalAudioStream(muted);
  }
  cameraOff(off: boolean) {
    this.engine?.muteLocalVideoStream(off);
    this.engine?.enableLocalVideo(!off);
  }
  speaker(on: boolean) {
    this.engine?.setEnableSpeakerphone(on);
  }
  switchCamera() {
    this.engine?.switchCamera();
  }

  /** leaveChannel -> release. Birden çok kez çağrılabilir. */
  stop() {
    if (this.stopped) return;
    this.stopped = true;
    const e = this.engine;
    this.engine = undefined;
    if (active === this) active = null;
    if (!e) return;
    try {
      if (this.handler) e.unregisterEventHandler(this.handler);
      if (this.mediaType === "video") e.stopPreview();
      e.leaveChannel();
    } catch {
      // kapanışta hata önemsiz
    } finally {
      try {
        e.release();
      } catch {
        // yut
      }
    }
  }
}

export const stopActiveCall = () => active?.stop();

onSignOut(() => stopActiveCall());
