import React from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Clock, Mic, Video } from "lucide-react-native";
import { C, DIAG, fin, SH } from "@/theme";
import { absoluteUrl } from "@/config";
import type { LiveSessionDto } from "@/api/types";
import { colorFor, initialsOf } from "@/utils/user";
import { outcomeText, primaryCta, statusLabel } from "@/utils/live";
import { formatWhen } from "@/utils/time";
import { useNow } from "@/hooks/useNow";
import { Avatar, Press, Ripple, T } from "@/components/ui";
import { CtaButton, MetaChip, TimeHint } from "./parts";

/**
 * Satıştaki ilan ya da kendi oturumun için kart. Dokununca oturum ekranı açılır;
 * düğme (Katıl / Cevapla / Satın al) varsa doğrudan eyleme gider.
 */
export function LiveCard({
  s,
  width = 286,
  onOpen,
  onJoin,
}: {
  s: LiveSessionDto;
  width?: number | `${number}%`;
  onOpen: (id: string) => void;
  onJoin?: (s: LiveSessionDto) => void;
}) {
  const lesson = s.kind === "Lesson";
  const color = colorFor(s.host.id);
  const mine = s.myRole !== "none";
  const nowMs = useNow(15_000);
  const cta = primaryCta(s, nowMs);
  const when = lesson && s.scheduledAtUtc ? formatWhen(s.scheduledAtUtc, nowMs) : null;
  const joinable = cta.kind === "join" || cta.kind === "rejoin" || (cta.kind === "answer" && mine);
  const result = mine ? outcomeText(s) : null;

  const act = () => {
    if (cta.enabled && (cta.kind === "join" || cta.kind === "rejoin" || cta.kind === "answer") && onJoin)
      onJoin(s);
    else onOpen(s.id);
  };

  return (
    <Press
      onPress={() => onOpen(s.id)}
      style={[
        fin,
        {
          width,
          backgroundColor: "#fff",
          overflow: "hidden",
          borderWidth: joinable ? 1.5 : 1,
          borderColor: joinable ? C.coral : "rgba(220,234,247,.9)",
        },
        SH.card,
      ]}
    >
      <LinearGradient
        colors={[C.abyss, color, C.lagoon]}
        {...DIAG}
        style={{ height: 96, padding: 14, overflow: "hidden", justifyContent: "space-between" }}
      >
        <View style={{ position: "absolute", right: -6, top: -14, opacity: 0.55 }}>
          {joinable ? <Ripple size={96} color="rgba(255,255,255,.7)" /> : null}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <View
            style={{
              flexShrink: 1,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,.2)",
            }}
          >
            <T f="bb" style={{ color: "#fff", fontSize: 10 }} numberOfLines={1}>
              {s.courseName}
            </T>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              paddingHorizontal: 9,
              paddingVertical: 5,
              borderRadius: 999,
              backgroundColor: "rgba(6,26,58,.35)",
            }}
          >
            {lesson ? <Video size={11} color="#fff" /> : <Mic size={11} color="#fff" />}
            <T f="bb" style={{ color: "#fff", fontSize: 10 }}>
              {lesson ? "Görüntülü eğitim" : "Sesli soru"}
            </T>
          </View>
        </View>
        {when ? (
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 7 }}>
            <T f="h" style={{ color: "#fff", fontSize: 25, lineHeight: 28 }}>
              {when.time}
            </T>
            <T f="bb" style={{ color: "rgba(255,255,255,.88)", fontSize: 12 }}>
              {when.day}
            </T>
          </View>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
            <T f="h" style={{ color: "#fff", fontSize: 25, lineHeight: 28 }}>
              +{s.payout} ✦
            </T>
            <T f="bb" style={{ color: "rgba(255,255,255,.88)", fontSize: 12 }}>
              cevaplayana
            </T>
          </View>
        )}
      </LinearGradient>

      <View style={{ padding: 15, gap: 10 }}>
        <T f="h" style={{ fontSize: 16, lineHeight: 21 }} numberOfLines={2}>
          {s.title}
        </T>
        <T style={{ fontSize: 11.5, color: C.muted, lineHeight: 16.5 }} numberOfLines={2}>
          {s.description}
        </T>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
          <Avatar
            initials={initialsOf(s.host.displayName)}
            color={color}
            uri={s.host.avatarUrl ? absoluteUrl(s.host.avatarUrl) : null}
            size={30}
          />
          <View style={{ flex: 1 }}>
            <T f="bb" style={{ fontSize: 12 }} numberOfLines={1}>
              {s.host.displayName}
            </T>
            <T style={{ fontSize: 10, color: C.muted }}>
              {s.myRole === "host" ? "Sen · " : ""}
              {lesson ? "Eğitmen" : "Soran"}
            </T>
          </View>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {lesson && s.durationMinutes ? (
            <MetaChip icon={<Clock size={11} color={C.muted} />} label={`${s.durationMinutes} dk`} />
          ) : null}
          {lesson ? <MetaChip tone="coin" label={`${s.price} ✦`} /> : null}
          {mine ? <MetaChip tone={joinable ? "live" : "soft"} label={statusLabel(s)} /> : null}
        </View>

        {mine ? <TimeHint s={s} nowMs={nowMs} /> : null}
        {result ? (
          <T style={{ fontSize: 11, color: C.muted, lineHeight: 16 }}>{result}</T>
        ) : null}

        <CtaButton cta={cta} onPress={act} />
      </View>
    </Press>
  );
}
