import React, { useEffect } from "react";
import { Alert, BackHandler, StyleSheet, View } from "react-native";
import {
  Mic,
  MicOff,
  PhoneOff,
  SwitchCamera,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
} from "lucide-react-native";
import { C } from "@/theme";
import { absoluteUrl } from "@/config";
import { errorMessage } from "@/api/errors";
import { useEndLive, useLiveSession } from "@/queries";
import { useLiveCall } from "@/hooks/useLiveCall";
import { useServerClock, useTick } from "@/hooks/useServerCountdown";
import { loadAgora } from "@/live/agora";
import { isFinal } from "@/utils/live";
import { toDate } from "@/utils/time";
import { colorFor, initialsOf } from "@/utils/user";
import { Avatar, GradBtn, Press, T } from "@/components/ui";

export type CallScreenProps = {
  id: string;
  topInset: number;
  bottomInset: number;
  /** Kanaldan ayrıl ve oturum ekranına dön (görüşme bitmez) */
  onClose: () => void;
  showToast: (m: string) => void;
};

const BG = "#07142C";

function fmtDuration(ms: number) {
  const t = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function RoundBtn({
  on,
  danger,
  onPress,
  children,
  label,
}: {
  on?: boolean;
  danger?: boolean;
  onPress: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <View style={{ alignItems: "center", gap: 6 }}>
      <Press
        onPress={onPress}
        accessibilityLabel={label}
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: danger ? C.error : on ? "#fff" : "rgba(255,255,255,0.16)",
        }}
      >
        {children}
      </Press>
      <T style={{ fontSize: 10, color: "rgba(255,255,255,0.75)" }}>{label}</T>
    </View>
  );
}

export function CallScreen(p: CallScreenProps) {
  const q = useLiveSession(p.id);
  const s = q.data;
  const video = s?.mediaType === "video";
  const call = useLiveCall(p.id, s?.mediaType);
  const end = useEndLive();
  const clock = useServerClock(s?.serverNowUtc, q.dataUpdatedAt);
  useTick(!!s?.liveStartedAtUtc);

  const peer = s ? (s.myRole === "host" ? s.guest : s.host) : null;

  // oturum Live dışına çıktıysa (karşı taraf bitirdi, süre doldu...) kanaldan ayrıl
  const gone = !!s && (isFinal(s.status) || s.status === "AwaitingApproval");
  useEffect(() => {
    if (!gone) return;
    call.stop();
    p.showToast(s!.status === "AwaitingApproval" ? "Görüşme bitti" : "Görüşme sona erdi");
    p.onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gone]);

  const confirmLeave = () =>
    Alert.alert(
      "Görüşmeden ayrıl",
      "Kanaldan çıkarsın ama görüşme bitmez; süre akar. Oturum ekranından tekrar katılabilirsin.",
      [
        { text: "Kal", style: "cancel" },
        {
          text: "Ayrıl",
          onPress: () => {
            call.stop();
            p.onClose();
          },
        },
      ],
    );

  const confirmEnd = () =>
    Alert.alert("Görüşmeyi bitir", "Görüşme sonlanacak ve değerlendirmeye geçilecek.", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Bitir",
        style: "destructive",
        onPress: async () => {
          try {
            await end.mutateAsync(p.id);
            call.stop();
            p.onClose();
          } catch (e) {
            p.showToast(errorMessage(e));
          }
        },
      },
    ]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      confirmLeave();
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const A = video ? loadAgora() : null;
  const Surface = A?.RtcSurfaceView;

  const elapsed =
    s?.liveStartedAtUtc != null ? clock.now() - toDate(s.liveStartedAtUtc).getTime() : null;

  let status = "Bağlanıyor…";
  if (call.phase === "connected") {
    status = call.reconnecting
      ? "Bağlantı sorunu, yeniden bağlanıyor…"
      : call.peerLeft
        ? "Karşı taraf ayrıldı"
        : call.peerUid != null || s?.peerJoined
          ? "Bağlandın"
          : "Karşı taraf bekleniyor…";
  }

  const remoteVisible = video && call.phase === "connected" && call.peerUid != null && Surface;

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: BG }]}>
      {/* ---- uzak video / avatar ---- */}
      {remoteVisible ? (
        <Surface style={StyleSheet.absoluteFill} canvas={{ uid: call.peerUid! }} />
      ) : (
        <View style={styles.center}>
          {peer && (
            <Avatar
              initials={initialsOf(peer.displayName)}
              color={colorFor(peer.id)}
              uri={peer.avatarUrl ? absoluteUrl(peer.avatarUrl) : null}
              size={110}
            />
          )}
          <T f="bb" style={{ color: "#fff", fontSize: 18, marginTop: 14 }}>
            {peer?.displayName ?? "Karşı taraf"}
          </T>
        </View>
      )}

      {/* ---- yerel önizleme ---- */}
      {video && Surface && call.phase === "connected" && !call.cameraOff && (
        <View style={[styles.preview, { top: p.topInset + 58 }]}>
          <Surface style={{ flex: 1 }} canvas={{ uid: 0 }} zOrderMediaOverlay />
        </View>
      )}

      {/* ---- üst çubuk ---- */}
      <View style={[styles.top, { paddingTop: p.topInset + 10 }]}>
        <Press onPress={confirmLeave} style={styles.leave}>
          <T f="bb" style={{ color: "#fff", fontSize: 12 }}>
            Küçült
          </T>
        </Press>
        <View style={{ alignItems: "flex-end", flex: 1 }}>
          <T f="bb" style={{ color: "#fff", fontSize: 13 }} numberOfLines={1}>
            {s?.title ?? ""}
          </T>
          <T style={{ color: "rgba(255,255,255,0.75)", fontSize: 11 }}>
            {elapsed != null ? fmtDuration(elapsed) : status}
          </T>
        </View>
      </View>

      {/* ---- durum / hata ---- */}
      <View style={[styles.statusBox, { top: p.topInset + 120 }]}>
        {call.phase !== "failed" && elapsed != null && (
          <T style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, textAlign: "center" }}>
            {status}
          </T>
        )}
        {call.phase === "connected" && call.peerLeft && (
          <T style={{ color: C.sun, fontSize: 12, textAlign: "center", marginTop: 6 }}>
            Karşı taraf ayrıldı. Görüşmeyi bitirmek ister misin?
          </T>
        )}
        {call.phase === "failed" && call.failure && (
          <View style={{ gap: 10, alignItems: "center" }}>
            <T style={{ color: "#fff", fontSize: 13, textAlign: "center" }}>
              {call.failure.message}
            </T>
            {call.failure.needsSettings && (
              <GradBtn label="Ayarları aç" onPress={call.openSettings} />
            )}
            {!call.failure.fatal && <GradBtn label="Tekrar dene" onPress={() => call.retry()} />}
            <Press onPress={p.onClose}>
              <T f="bb" style={{ color: "#fff", fontSize: 12 }}>
                Geri dön
              </T>
            </Press>
          </View>
        )}
      </View>

      {/* ---- kontroller ---- */}
      <View style={[styles.controls, { paddingBottom: p.bottomInset + 18 }]}>
        <RoundBtn
          label={call.muted ? "Sesi aç" : "Sessiz"}
          on={call.muted}
          onPress={call.toggleMute}
        >
          {call.muted ? <MicOff size={22} color={BG} /> : <Mic size={22} color="#fff" />}
        </RoundBtn>
        {video && (
          <RoundBtn
            label={call.cameraOff ? "Kamerayı aç" : "Kamera"}
            on={call.cameraOff}
            onPress={call.toggleCamera}
          >
            {call.cameraOff ? <VideoOff size={22} color={BG} /> : <Video size={22} color="#fff" />}
          </RoundBtn>
        )}
        {video && (
          <RoundBtn label="Çevir" onPress={call.switchCamera}>
            <SwitchCamera size={22} color="#fff" />
          </RoundBtn>
        )}
        <RoundBtn label="Hoparlör" on={call.speaker} onPress={call.toggleSpeaker}>
          {call.speaker ? <Volume2 size={22} color={BG} /> : <VolumeX size={22} color="#fff" />}
        </RoundBtn>
        <RoundBtn label="Bitir" danger onPress={confirmEnd}>
          <PhoneOff size={22} color="#fff" />
        </RoundBtn>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
  top: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(7,20,44,0.45)",
  },
  leave: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  preview: {
    position: "absolute",
    right: 16,
    width: 100,
    height: 140,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  statusBox: { position: "absolute", left: 24, right: 24 },
  controls: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 16,
    flexDirection: "row",
    justifyContent: "space-evenly",
    backgroundColor: "rgba(7,20,44,0.55)",
  },
});
