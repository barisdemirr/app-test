import React from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Gem,
  Home,
  PlayCircle,
  Plus,
  UserRound,
} from "lucide-react-native";
import { C, DIAG, shadow } from "@/theme";
import type { Screen } from "@/types";
import { Press, T } from "@/components/ui";

export type BottomNavProps = {
  screen: Screen;
  navBottom: number;
  navHeight: number;
  navWrap: number;
  onNavigate: (s: Screen) => void;
};

export function BottomNav(p: BottomNavProps) {
  const currentTab: Screen = p.screen === "list" || p.screen === "live" ? "home" : p.screen;

  const navItems: {
    id: Screen;
    label: string;
    icon: (c: string) => React.ReactNode;
  }[] = [
    {
      id: "home",
      label: "Anasayfa",
      icon: (c) => <Home size={19} color={c} />,
    },
    {
      id: "feed",
      label: "Akış",
      icon: (c) => <PlayCircle size={20} color={c} />,
    },
    {
      id: "rewards",
      label: "Premium",
      icon: (c) => <Gem size={19} color={c} />,
    },
    {
      id: "profile",
      label: "Profil",
      icon: (c) => <UserRound size={19} color={c} />,
    },
  ];

  const navBtn = (it: (typeof navItems)[number]) => {
    const on = currentTab === it.id;
    const col = on ? C.tide : "#8090A6";
    return (
      <Press
        key={it.id}
        onPress={() => p.onNavigate(it.id)}
        style={{
          flex: 1,
          height: p.navHeight,
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
        }}
      >
        {it.icon(col)}
        <T f={on ? "bb" : "bm"} style={{ fontSize: 10, color: col }}>
          {it.label}
        </T>
        {on && (
          <View
            style={{
              position: "absolute",
              bottom: 3,
              width: 15,
              height: 3,
              borderRadius: 9,
              backgroundColor: C.tide,
            }}
          />
        )}
      </Press>
    );
  };

  return (
    <View
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: p.navBottom,
        height: p.navWrap,
        zIndex: 20,
      }}
      pointerEvents="box-none"
    >
      <View
        style={[
          {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: p.navHeight,
            borderRadius: 24,
            backgroundColor: "rgba(255,255,255,.97)",
            borderWidth: 1,
            borderColor: "rgba(220,234,247,.8)",
          },
          shadow(0.17, 16, 8),
        ]}
      />
      <View
        style={{
          position: "absolute",
          left: 6,
          right: 6,
          bottom: 0,
          height: p.navHeight,
          flexDirection: "row",
          alignItems: "center",
        }}
        pointerEvents="box-none"
      >
        {navBtn(navItems[0])}
        {navBtn(navItems[1])}
        <View style={{ flex: 1 }} />
        {navBtn(navItems[2])}
        {navBtn(navItems[3])}
      </View>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          alignItems: "center",
        }}
        pointerEvents="box-none"
      >
        <View
          style={{
            position: "absolute",
            top: -8,
            width: 72,
            height: 72,
            borderRadius: 36,
            borderWidth: 1,
            borderColor: "rgba(255,122,92,.22)",
          }}
          pointerEvents="none"
        />
        <Press
          onPress={() => p.onNavigate("new")}
          style={[
            {
              width: 56,
              height: 56,
              borderRadius: 28,
              overflow: "hidden",
              alignItems: "center",
              justifyContent: "center",
            },
            shadow(0.34, 12, 8, C.coral),
          ]}
        >
          <LinearGradient
            colors={[C.coral, C.sun]}
            {...DIAG}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={{
              position: "absolute",
              top: 5,
              left: 5,
              right: 5,
              bottom: 5,
              borderRadius: 28,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,.4)",
            }}
          />
          <Plus size={25} color="#fff" />
        </Press>
      </View>
    </View>
  );
}