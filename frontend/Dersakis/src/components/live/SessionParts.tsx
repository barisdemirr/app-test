import React from "react";
import { View } from "react-native";
import { Check, CircleX } from "lucide-react-native";
import { C } from "@/theme";
import type { LiveSessionDto } from "@/api/types";
import { timelineOf } from "@/utils/live";
import { formatClock } from "@/utils/time";
import { T } from "@/components/ui";

/** Oturum ekranlarının (sesli soru + eğitim) ortak parçaları */
export const sessionCard = { backgroundColor: "#fff", borderRadius: 22, padding: 16 } as const;

export function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "rgba(255,255,255,.12)",
        borderRadius: 16,
        padding: 11,
        gap: 5,
      }}
    >
      {icon}
      <T style={{ color: "rgba(255,255,255,.72)", fontSize: 10 }}>{label}</T>
      <T f="bb" style={{ color: "#fff", fontSize: 13 }} numberOfLines={1}>
        {value}
      </T>
    </View>
  );
}

export function Timeline({ s }: { s: LiveSessionDto }) {
  const { steps, current, failed } = timelineOf(s);
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
      {steps.map((name, i) => {
        const done = i < current;
        const now = i === current && !failed && s.status !== "Completed";
        const bad = failed && i === current;
        const col = bad ? C.error : done || s.status === "Completed" ? C.success : now ? C.tide : C.mist;
        return (
          <View key={name} style={{ flex: 1, alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", alignSelf: "stretch" }}>
              <View style={{ flex: 1, height: 2, backgroundColor: i === 0 ? "transparent" : done || s.status === "Completed" ? C.success : C.mist }} />
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: done || s.status === "Completed" || bad ? col : "#fff",
                  borderWidth: 2,
                  borderColor: col,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {bad ? (
                  <CircleX size={12} color="#fff" />
                ) : done || s.status === "Completed" ? (
                  <Check size={13} color="#fff" />
                ) : now ? (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: col }} />
                ) : null}
              </View>
              <View style={{ flex: 1, height: 2, backgroundColor: i === steps.length - 1 ? "transparent" : done ? C.success : C.mist }} />
            </View>
            <T
              f={now || bad ? "bb" : "b"}
              style={{ fontSize: 9.5, marginTop: 6, color: now ? C.tide : bad ? C.error : C.muted, textAlign: "center" }}
              numberOfLines={1}
            >
              {name}
            </T>
          </View>
        );
      })}
    </View>
  );
}

export function Clock_({ label, ms, hint, hot }: { label: string; ms: number; hint?: string; hot?: boolean }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 6 }}>
      <T style={{ color: C.muted, fontSize: 11.5 }}>{label}</T>
      <T f="h" style={{ fontSize: 38, lineHeight: 46, color: hot ? C.coral : C.tide, marginTop: 2, letterSpacing: -1 }}>
        {ms > 0 ? formatClock(ms) : "Güncelleniyor…"}
      </T>
      {hint ? <T style={{ color: C.muted, fontSize: 11, marginTop: 2, textAlign: "center" }}>{hint}</T> : null}
    </View>
  );
}

