import React from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight, Clock, Lock, Mic, Radio, Video } from "lucide-react-native";
import { C, DIAG, G_CORAL, G_PRIMARY } from "@/theme";
import type { LiveSessionDto } from "@/api/types";
import type { LiveCta } from "@/utils/live";
import { formatRemaining, formatWhen, toDate } from "@/utils/time";
import { GradBtn, LiveDot, Press, Pulse, T } from "@/components/ui";

/** "Bugün / 18:30" tarih rozeti. Zamansız (sesli) oturumda mikrofon simgesi. */
export function DateBadge({
  s,
  nowMs,
  size = 62,
}: {
  s: LiveSessionDto;
  nowMs: number;
  size?: number;
}) {
  const lesson = s.kind === "Lesson";
  const w = lesson && s.scheduledAtUtc ? formatWhen(s.scheduledAtUtc, nowMs) : null;
  return (
    <LinearGradient
      colors={lesson ? ["#0A2A66", C.tide] : [C.coral, C.coral2]}
      {...DIAG}
      style={{
        width: size,
        height: size,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 4,
      }}
    >
      {w ? (
        <>
          <T f="bb" style={{ color: "rgba(255,255,255,.82)", fontSize: 9.5, letterSpacing: 0.4 }} numberOfLines={1}>
            {w.day.toLocaleUpperCase("tr-TR")}
          </T>
          <T f="h" style={{ color: "#fff", fontSize: 17, lineHeight: 21 }}>
            {w.time}
          </T>
        </>
      ) : (
        <Mic size={size * 0.38} color="#fff" />
      )}
    </LinearGradient>
  );
}

/** Küçük bilgi hapı: simge + metin. */
export function MetaChip({
  icon,
  label,
  tone = "soft",
}: {
  icon?: React.ReactNode;
  label: string;
  tone?: "soft" | "coin" | "live";
}) {
  const bg = tone === "coin" ? "#FFF3CB" : tone === "live" ? "#E6F8F1" : C.foam;
  const fg = tone === "coin" ? "#8A5A00" : tone === "live" ? "#127A55" : C.muted;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: bg,
        borderRadius: 999,
        paddingHorizontal: 9,
        paddingVertical: 5,
      }}
    >
      {icon}
      <T f="bs" style={{ fontSize: 10.5, color: fg }}>
        {label}
      </T>
    </View>
  );
}

export const kindIcon = (s: LiveSessionDto, color = C.tide, size = 12) =>
  s.kind === "Lesson" ? <Video size={size} color={color} /> : <Mic size={size} color={color} />;

/** "Başlamasına 2 sa 14 dk" / "Şimdi katılabilirsin" / "Görüşme sürüyor" */
export function timeHint(s: LiveSessionDto, nowMs: number): { text: string; live: boolean } | null {
  if (s.status === "Live") return { text: "Görüşme sürüyor", live: true };
  if (s.canJoin) {
    if (s.joinDeadlineUtc) {
      const left = toDate(s.joinDeadlineUtc).getTime() - nowMs;
      if (left > 0) return { text: `Katılım için ${formatRemaining(left)} var`, live: true };
    }
    return { text: "Şimdi katılabilirsin", live: true };
  }
  if ((s.status === "Booked" || s.status === "Listed") && s.scheduledAtUtc) {
    const left = toDate(s.scheduledAtUtc).getTime() - nowMs;
    if (left > 0) return { text: `Başlamasına ${formatRemaining(left)}`, live: false };
    return { text: "Başlıyor…", live: false };
  }
  return null;
}

export function TimeHint({ s, nowMs }: { s: LiveSessionDto; nowMs: number }) {
  const h = timeHint(s, nowMs);
  if (!h) return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 7, flexShrink: 1 }}>
      {h.live ? <LiveDot color={C.coral} size={7} /> : <Clock size={13} color={C.muted} />}
      <T f="bs" style={{ fontSize: 11.5, color: h.live ? C.coral : C.muted, flexShrink: 1 }} numberOfLines={1}>
        {h.text}
      </T>
    </View>
  );
}

/**
 * Oturumun ana eylem düğmesi. Katılabiliyorsan canlı, nabız atan bir düğme;
 * katılamıyorsan pasif ama görünür (neden / ne zaman yazar). Eylem yoksa hiçbir şey çizmez.
 */
export function CtaButton({
  cta,
  onPress,
  small = true,
  disabled,
}: {
  cta: LiveCta;
  onPress: () => void;
  small?: boolean;
  disabled?: boolean;
}) {
  if (cta.kind === "none") return null;
  if (!cta.enabled) {
    return (
      <Press
        onPress={onPress}
        style={{
          minHeight: small ? 40 : 48,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: C.mist,
          borderStyle: "dashed",
          backgroundColor: C.foam,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 7,
          paddingHorizontal: 12,
        }}
      >
        {cta.kind === "wait" ? <Lock size={14} color={C.muted} /> : null}
        <T f="bb" style={{ fontSize: small ? 12 : 13.5, color: C.muted }} numberOfLines={1}>
          {cta.label}
        </T>
      </Press>
    );
  }
  const live = cta.kind === "join" || cta.kind === "rejoin";
  const btn = (
    <GradBtn
      label={cta.label}
      onPress={onPress}
      small={small}
      disabled={disabled}
      colors={cta.kind === "review" ? G_PRIMARY : G_CORAL}
      icon={
        live ? (
          <Radio size={small ? 15 : 17} color="#fff" />
        ) : cta.kind === "review" ? undefined : (
          <ArrowRight size={small ? 14 : 16} color="#fff" />
        )
      }
    />
  );
  return live ? <Pulse to={1.025}>{btn}</Pulse> : btn;
}
