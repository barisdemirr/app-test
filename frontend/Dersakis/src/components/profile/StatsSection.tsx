import React from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { C, fin, HORZ, SH } from "@/theme";
import { useStats } from "@/queries";
import { SectionTitle, T } from "@/components/ui";

/** "Derslerdeki başarım": genel doğruluk + ders bazında gerçek istatistik. */
export function StatsSection() {
  const { data } = useStats();
  const answered = data?.answered ?? 0;

  return (
    <>
      <SectionTitle title="Derslerdeki başarım" />
      <LinearGradient
        colors={[C.deep, C.tide]}
        {...HORZ}
        style={[
          fin,
          { flexDirection: "row", alignItems: "center", gap: 13, padding: 17, marginTop: -5 },
        ]}
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            borderWidth: 4,
            borderColor: "rgba(255,255,255,.22)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <T f="h" style={{ color: "#fff", fontSize: 15 }}>
            {data?.percent ?? 0}%
          </T>
        </View>
        <View style={{ flex: 1 }}>
          <T f="bb" style={{ color: "#fff", fontSize: 14 }}>
            Genel doğruluk
          </T>
          <T style={{ color: "#CFE2F6", fontSize: 10, marginTop: 3 }}>
            {answered === 0
              ? "Henüz soru çözmedin."
              : `${answered} soru çözdün, ${data?.correct ?? 0} doğru. Böyle devam!`}
          </T>
        </View>
      </LinearGradient>

      {(data?.courses ?? [])
        .filter((c) => c.answered > 0)
        .map((c) => {
          const low = c.percent < 60;
          return (
            <View
              key={c.courseId}
              style={[
                { marginTop: 9, padding: 13, borderRadius: 15, backgroundColor: "#fff" },
                SH.soft,
              ]}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <T f="bb" style={{ fontSize: 12 }}>
                  {c.courseName}
                </T>
                <T f="bb" style={{ fontSize: 12, color: low ? C.coral : C.tide }}>
                  {c.percent}%
                </T>
              </View>
              <View
                style={{
                  height: 5,
                  marginTop: 9,
                  marginBottom: 6,
                  borderRadius: 8,
                  backgroundColor: C.mist,
                }}
              >
                <View
                  style={{
                    width: `${c.percent}%`,
                    height: 5,
                    borderRadius: 8,
                    backgroundColor: low ? C.coral : C.tide,
                  }}
                />
              </View>
              <T style={{ fontSize: 10, color: C.muted }}>
                {c.answered} çözülen · {c.correct} doğru
              </T>
            </View>
          );
        })}
    </>
  );
}
