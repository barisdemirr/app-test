import React from "react";
import { View } from "react-native";
import { Bell } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { C, DIAG, G_PRIMARY, SH } from "@/theme";
import { AnimatedNumber, Logo, Press, Sonar, T } from "@/components/ui";

export type HeaderProps = {
  topInset: number;
  credits: number;
  earnedToday: number;
  dailyCap: number;
  unread: number;
  onBell: () => void;
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
        <Logo size={28} />
        <T f="h" style={{ fontSize: 20, color: C.abyss, letterSpacing: -0.6 }}>
          Dersakış
        </T>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Press
        onPress={p.onBell}
        style={[
          {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#fff",
            alignItems: "center",
            justifyContent: "center",
          },
          SH.soft,
        ]}
      >
        <Bell size={17} color={C.abyss} />
        {p.unread > 0 && (
          <View
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              minWidth: 17,
              height: 17,
              paddingHorizontal: 4,
              borderRadius: 9,
              backgroundColor: C.coral,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <T f="bb" style={{ color: "#fff", fontSize: 9 }}>
              {p.unread > 9 ? "9+" : p.unread}
            </T>
          </View>
        )}
      </Press>
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
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 3 }}>
          <AnimatedNumber value={p.credits} f="bb" style={{ fontSize: 11, color: C.abyss }} />
          <T f="bb" style={{ fontSize: 11, color: C.abyss }}>
            kredi
          </T>
        </View>
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
              width: `${p.dailyCap ? Math.min(100, (p.earnedToday / p.dailyCap) * 100) : 0}%`,
              height: 3,
              borderRadius: 9,
              backgroundColor: C.tide,
            }}
          />
        </View>
      </View>
      </View>
    </View>
  );
}