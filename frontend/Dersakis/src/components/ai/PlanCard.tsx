import React from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { C, G_PRIMARY } from "@/theme";
import { T } from "@/components/ui/T";
import { Enter } from "@/components/ui/motion";
import type { AiPlan } from "@/api/ai";

/** Günlere bölünmüş çalışma planı. Tüm metinler düz metin olarak çizilir. */
export function PlanCard({ plan }: { plan: AiPlan }) {
  const total = plan.days.reduce((a, d) => a + d.tasks.reduce((b, t) => b + (t.minutes || 0), 0), 0);
  const h = Math.floor(total / 60);
  const m = total % 60;
  const totalText = h ? `${h} sa${m ? ` ${m} dk` : ""}` : `${m} dk`;

  return (
    <View style={{ borderRadius: 16, overflow: "hidden", backgroundColor: C.foam, borderWidth: 1, borderColor: C.mist }}>
      <LinearGradient colors={G_PRIMARY} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 14, paddingVertical: 10 }}>
        <T f="h" style={{ color: "#fff", fontSize: 15 }}>📋 {plan.title}</T>
        <T f="bm" style={{ color: "rgba(255,255,255,.88)", fontSize: 12, marginTop: 2 }}>
          {plan.days.length} gün · toplam {totalText}
        </T>
      </LinearGradient>
      <View style={{ padding: 10, gap: 10 }}>
        {plan.days.map((d, i) => (
          <Enter key={`${d.day}-${i}`} delay={i * 70} y={10}>
            <T f="hm" style={{ fontSize: 13, color: C.deep, marginBottom: 6 }}>{d.day}</T>
            <View style={{ gap: 6 }}>
              {d.tasks.map((t, j) => (
                <View
                  key={j}
                  style={{ flexDirection: "row", gap: 10, backgroundColor: C.pearl, borderRadius: 12, padding: 10, alignItems: "flex-start" }}
                >
                  <View style={{ minWidth: 46, paddingVertical: 4, borderRadius: 10, backgroundColor: "#E6F0FF", alignItems: "center" }}>
                    <T f="h" style={{ fontSize: 13, color: C.tide }}>{t.minutes}</T>
                    <T f="bm" style={{ fontSize: 10, color: C.tide }}>dk</T>
                  </View>
                  <View style={{ flex: 1 }}>
                    <T f="hm" style={{ fontSize: 13.5 }}>{t.topic}</T>
                    <T f="b" style={{ fontSize: 13, color: C.muted, lineHeight: 18, marginTop: 1 }}>{t.what}</T>
                  </View>
                </View>
              ))}
            </View>
          </Enter>
        ))}
      </View>
    </View>
  );
}
