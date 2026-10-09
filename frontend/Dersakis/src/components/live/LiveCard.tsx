import React from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { C, DIAG, fin, SH } from "@/theme";
import { absoluteUrl } from "@/config";
import type { LiveSessionDto } from "@/api/types";
import { colorFor, initialsOf } from "@/utils/user";
import { outcomeText, statusLabel } from "@/utils/live";
import { formatDateTime } from "@/utils/time";
import { Avatar, GradBtn, MiniPill, Press, Sonar, T } from "@/components/ui";

/** Satıştaki ilan ya da kendi oturumun için kart. Dokununca oturum ekranı açılır. */
export function LiveCard({
  s,
  width = 286,
  onOpen,
}: {
  s: LiveSessionDto;
  width?: number | `${number}%`;
  onOpen: (id: string) => void;
}) {
  const lesson = s.kind === "Lesson";
  const color = colorFor(s.host.id);
  const mineOrBusy = s.myRole !== "none";
  const action = mineOrBusy
    ? statusLabel(s)
    : lesson
      ? `Satın al · ${s.price} ✦`
      : `Cevapla · +${s.payout} ✦`;

  return (
    <Press
      onPress={() => onOpen(s.id)}
      style={[
        fin,
        {
          width,
          backgroundColor: "#fff",
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(220,234,247,.8)",
        },
        SH.card,
      ]}
    >
      <LinearGradient
        colors={[C.abyss, color, C.lagoon]}
        {...DIAG}
        style={{ height: 70, padding: 14, overflow: "hidden" }}
      >
        <View style={{ position: "absolute", right: 18, top: 2, opacity: 0.55 }}>
          <Sonar size={70} />
        </View>
        <View
          style={{
            alignSelf: "flex-start",
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,.2)",
          }}
        >
          <T f="bb" style={{ color: "#fff", fontSize: 10 }}>
            {s.courseName}
          </T>
        </View>
      </LinearGradient>
      <View style={{ padding: 15 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
          <Avatar
            initials={initialsOf(s.host.displayName)}
            color={color}
            uri={s.host.avatarUrl ? absoluteUrl(s.host.avatarUrl) : null}
            size={32}
          />
          <View style={{ flex: 1 }}>
            <T f="bb" style={{ fontSize: 12 }} numberOfLines={1}>
              {s.host.displayName}
            </T>
            <T style={{ fontSize: 10, color: C.muted }}>
              {lesson ? "Eğitmen" : "Soran"}
            </T>
          </View>
        </View>
        <T
          f="h"
          style={{ fontSize: 16, lineHeight: 20, marginTop: 11, marginBottom: 5, minHeight: 40 }}
          numberOfLines={2}
        >
          {s.title}
        </T>
        <T
          style={{ fontSize: 11, color: C.muted, lineHeight: 16, minHeight: 48 }}
          numberOfLines={3}
        >
          {s.description}
        </T>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginVertical: 11 }}>
          <MiniPill label={lesson ? "Görüntülü" : "Sesli"} color={C.tide} />
          {lesson && s.scheduledAtUtc && <MiniPill label={formatDateTime(s.scheduledAtUtc)} />}
          {lesson && s.durationMinutes ? <MiniPill label={`${s.durationMinutes} dk`} /> : null}
        </View>
        {mineOrBusy && outcomeText(s) ? (
          <T style={{ fontSize: 11, color: C.muted, lineHeight: 16, marginBottom: 9 }}>
            {outcomeText(s)}
          </T>
        ) : null}
        <GradBtn label={action} onPress={() => onOpen(s.id)} small />
      </View>
    </Press>
  );
}
