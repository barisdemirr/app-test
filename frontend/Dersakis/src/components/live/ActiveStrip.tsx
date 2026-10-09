import React from "react";
import { View } from "react-native";
import { C, SH } from "@/theme";
import type { LiveSessionDto } from "@/api/types";
import { statusLabel } from "@/utils/live";
import { formatDateTime } from "@/utils/time";
import { Press, SectionTitle, T } from "@/components/ui";

/** "Devam eden / yaklaşan": yapılacak bir şeyin olan oturumlar (scope=active). */
export function ActiveStrip({
  items,
  onOpen,
}: {
  items: LiveSessionDto[];
  onOpen: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <>
      <SectionTitle title="Devam eden / yaklaşan" />
      <View style={{ gap: 8 }}>
        {items.map((s) => (
          <Press
            key={s.id}
            onPress={() => onOpen(s.id)}
            style={[
              {
                padding: 13,
                borderRadius: 16,
                backgroundColor: "#fff",
                borderWidth: 1,
                borderColor: s.status === "Live" || s.canJoin ? C.coral : C.mist,
                gap: 3,
              },
              SH.soft,
            ]}
          >
            <T f="bb" style={{ fontSize: 13 }} numberOfLines={1}>
              {s.title}
            </T>
            <T style={{ fontSize: 11, color: C.muted }}>
              {s.courseName} · {s.kind === "Lesson" ? "Eğitim" : "Sesli soru"} ·{" "}
              {s.scheduledAtUtc ? formatDateTime(s.scheduledAtUtc) : "hemen"}
            </T>
            <T f="bb" style={{ fontSize: 11, color: s.canJoin ? C.coral : C.tide }}>
              {s.canJoin ? "Şimdi katılabilirsin →" : statusLabel(s)}
            </T>
          </Press>
        ))}
      </View>
    </>
  );
}
