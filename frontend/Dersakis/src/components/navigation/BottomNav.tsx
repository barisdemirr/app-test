import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
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
import { Pulse, Press, T } from "@/components/ui";

export type BottomNavProps = {
  screen: Screen;
  navBottom: number;
  navHeight: number;
  navWrap: number;
  onNavigate: (s: Screen) => void;
};

function NavItem({
  on,
  label,
  icon,
  height,
  onPress,
}: {
  on: boolean;
  label: string;
  icon: (c: string) => React.ReactNode;
  height: number;
  onPress: () => void;
}) {
  const v = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(v, { toValue: on ? 1 : 0, useNativeDriver: true, speed: 18, bounciness: 12 }).start();
  }, [on, v]);
  const col = on ? C.tide : "#8090A6";
  return (
    <Press
      onPress={onPress}
      scaleTo={0.9}
      style={{ flex: 1, height, alignItems: "center", justifyContent: "center", gap: 3 }}
    >
      <Animated.View
        style={{
          transform: [
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) },
            { scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] }) },
          ],
        }}
      >
        {icon(col)}
      </Animated.View>
      <T f={on ? "bb" : "bm"} style={{ fontSize: 10, color: col }}>
        {label}
      </T>
      <Animated.View
        style={{
          position: "absolute",
          bottom: 3,
          width: 15,
          height: 3,
          borderRadius: 9,
          backgroundColor: C.tide,
          opacity: v,
          transform: [{ scaleX: v }],
        }}
      />
    </Press>
  );
}

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

  const navBtn = (it: (typeof navItems)[number]) => (
    <NavItem
      key={it.id}
      on={currentTab === it.id}
      label={it.label}
      icon={it.icon}
      height={p.navHeight}
      onPress={() => p.onNavigate(it.id)}
    />
  );

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
      {p.screen !== "feed" && (
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(242,248,255,0)", "rgba(242,248,255,.96)", C.foam]}
          locations={[0, 0.55, 1]}
          style={{
            position: "absolute",
            left: -16,
            right: -16,
            bottom: -p.navBottom,
            height: p.navWrap + p.navBottom + 14,
          }}
        />
      )}
      <View
        style={[
          {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: p.navHeight,
            borderRadius: 24,
            backgroundColor: "#FFFFFF",
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
        <Pulse
          to={1.12}
          duration={1400}
          style={{
            position: "absolute",
            top: -8,
            width: 72,
            height: 72,
            borderRadius: 36,
            borderWidth: 1.5,
            borderColor: "rgba(255,122,92,.3)",
          }}
        >
          <View style={{ width: 69, height: 69 }} pointerEvents="none" />
        </Pulse>
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