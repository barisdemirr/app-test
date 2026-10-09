import React from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { C, DIAG, G_PRIMARY, SH } from "@/theme";
import { Sonar, T } from "@/components/ui";

export type HeaderProps = {
  topInset: number;
  credits: number;
  earnedToday: number;
  dailyCap: number;
};

export function Header(p: HeaderProps) {
  return (
    <View
      style={{
        paddingTop: p.topInset + 8,
        paddingHorizontal: 19,
        paddingBottom: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: C.foam,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
        <LinearGradient
          colors={G_PRIMARY}
          {...DIAG}
          style={{
            width: 28,
            height: 28,
            borderTopLeftRadius: 14,
            borderTopRightRadius: 14,
            borderBottomRightRadius: 14,
            borderBottomLeftRadius: 5,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Svg width={16} height={10} viewBox="0 0 16 10">
            <Path
              d="M1 6 Q4 0 8 5 T15 4"
              stroke="#fff"
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
            />
          </Svg>
        </LinearGradient>
        <T f="h" style={{ fontSize: 20, color: C.abyss, letterSpacing: -0.6 }}>
          Dersakış
        </T>
      </View>
      <View
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 10,
            paddingVertical: 8,
            borderRadius: 999,
            backgroundColor: "#fff",
            overflow: "hidden",
          },
          SH.soft,
        ]}
      >
        <View style={{ position: "absolute", left: -6, top: -10 }}>
          <Sonar size={44} color="rgba(27,107,255,.14)" />
        </View>
        <LinearGradient
          colors={[C.sun, "#FFBC60"]}
          {...DIAG}
          style={{
            width: 19,
            height: 19,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <T f="bb" style={{ fontSize: 10, color: "#825A17" }}>
            ✦
          </T>
        </LinearGradient>
        <T f="bb" style={{ fontSize: 11, color: C.abyss }}>
          {p.credits} kredi
        </T>
        <View
          style={{
            width: 35,
            height: 3,
            borderRadius: 9,
            backgroundColor: C.mist,
          }}
        >
          <View
            style={{
              width: `${Math.min(100, (p.earnedToday / p.dailyCap) * 100)}%`,
              height: 3,
              borderRadius: 9,
              backgroundColor: C.tide,
            }}
          />
        </View>
      </View>
    </View>
  );
}