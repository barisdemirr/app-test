import React from "react";
import { ScrollView, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  CheckCircle2,
  Crown,
  Gem,
  Sparkles,
  UserRound,
} from "lucide-react-native";
import { C, DIAG, fin, SH } from "@/theme";
import type { Reward, RewardIcon } from "@/types";
import { rewardsData } from "@/mocks";
import {
  GradBtn,
  SectionTitle,
  Sonar,
  T,
} from "@/components/ui";

export type RewardsScreenProps = {
  credits: number;
  bodyPad: number;
  onRedeem: (r: Reward) => void;
};

const rewardIcon = (i: RewardIcon) => {
  const p = { size: 22, color: "#fff" };
  switch (i) {
    case "crown":
      return <Crown {...p} />;
    case "spark":
      return <Sparkles {...p} />;
    case "mentor":
      return <UserRound {...p} />;
    case "exam":
      return <CheckCircle2 {...p} />;
    default:
      return <Gem {...p} />;
  }
};

export function RewardsScreen(p: RewardsScreenProps) {
  const scrollProps = {
    showsVerticalScrollIndicator: false,
    keyboardShouldPersistTaps: "handled" as const,
    automaticallyAdjustKeyboardInsets: true,
    contentContainerStyle: {
      paddingHorizontal: 20,
      paddingBottom: p.bodyPad,
    },
  };

  return (
    <ScrollView {...scrollProps}>
      <T f="h" style={{ fontSize: 24, marginTop: 9, marginBottom: 15 }}>
        Premium ödüller
      </T>
      <LinearGradient
        colors={[C.abyss, C.deep, "#24A3C2"]}
        locations={[0, 0.65, 1]}
        {...DIAG}
        style={[
          fin,
          { padding: 20, paddingVertical: 21, overflow: "hidden" },
          SH.card,
        ]}
      >
        <View
          style={{ position: "absolute", right: 15, top: 10, opacity: 0.45 }}
        >
          <Sonar size={120} />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <LinearGradient
            colors={["#FFECA9", "#FFCA61"]}
            {...DIAG}
            style={{
              width: 38,
              height: 38,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <T f="bb" style={{ fontSize: 18, color: "#825A17" }}>
              ✦
            </T>
          </LinearGradient>
          <View>
            <T style={{ fontSize: 11, color: "#BBD8F2" }}>DERSAKIŞ CÜZDANIN</T>
            <T f="h" style={{ fontSize: 21, color: "#fff" }}>
              Bakiyen: {p.credits} kredi
            </T>
          </View>
        </View>
        <T style={{ color: "#D3E7FB", fontSize: 11, marginTop: 15 }}>
          Bilgiyi yakala, güzel şeylerin kilidini aç.
        </T>
      </LinearGradient>

      <SectionTitle title="Senin için seçtik" />
      <View style={{ gap: 10 }}>
        {rewardsData.map((r) => {
          const can = p.credits >= r.price;
          return (
            <View
              key={r.id}
              style={[
                r.featured ? fin : { borderRadius: 18 },
                {
                  minHeight: r.featured ? 114 : 88,
                  padding: 13,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  backgroundColor: r.featured ? "#F1F7FF" : "#fff",
                  borderWidth: 1,
                  borderColor: r.featured ? "#B9D7FF" : C.mist,
                },
                SH.soft,
              ]}
            >
              <LinearGradient
                colors={[r.featured ? C.coral : C.tide, C.lagoon]}
                {...DIAG}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {rewardIcon(r.icon)}
              </LinearGradient>
              <View style={{ flex: 1 }}>
                {r.featured && (
                  <T
                    f="bb"
                    style={{ color: C.coral, fontSize: 9, letterSpacing: 0.8 }}
                  >
                    ÖNE ÇIKAN
                  </T>
                )}
                <T f="bb" style={{ fontSize: 13, lineHeight: 17 }}>
                  {r.name}
                </T>
                <T style={{ color: C.muted, fontSize: 10, marginTop: 5 }}>
                  {r.source}
                </T>
              </View>
              <GradBtn
                label={`${r.price} ✦`}
                small
                disabled={!can}
                radius={{ borderRadius: 999 }}
                onPress={() => can && p.onRedeem(r)}
              />
            </View>
          );
        })}
      </View>
      <T
        style={{
          textAlign: "center",
          color: C.muted,
          fontSize: 10,
          lineHeight: 15,
          marginVertical: 16,
          marginHorizontal: 12,
        }}
      >
        Ödüller bu prototipte örnektir, gerçek bir teslimat yoktur.
      </T>
    </ScrollView>
  );
}