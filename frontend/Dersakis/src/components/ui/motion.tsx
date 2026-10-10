import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  StyleProp,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { C } from "@/theme";
import { T } from "./T";
import type { FontKey } from "@/theme";

/** Girişte aşağıdan yukarı süzülerek belirir. `delay` ile sıralı (stagger) kullanılır. */
export function Enter({
  children,
  delay = 0,
  y = 16,
  duration = 460,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v,
          transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [y, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Ekran geçişi: içerik her açılışta hafifçe kayarak belirir. */
export function ScreenFade({ children }: { children: React.ReactNode }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: v,
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}

/** Sonsuz nefes alıp verme (dikkat çekmek için: Katıl butonu, canlı rozeti). */
export function Pulse({
  children,
  to = 1.05,
  duration = 900,
  style,
  active = true,
}: {
  children: React.ReactNode;
  to?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  active?: boolean;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) {
      v.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, duration, v]);
  return (
    <Animated.View
      style={[style, { transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, to] }) }] }]}
    >
      {children}
    </Animated.View>
  );
}

/** Dışa doğru yayılan halka (sonar). Görünür bir "canlı" hissi verir. */
export function Ripple({
  size = 80,
  color = C.coral,
  rings = 2,
  duration = 2000,
}: {
  size?: number;
  color?: string;
  rings?: number;
  duration?: number;
}) {
  return (
    <View pointerEvents="none" style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      {Array.from({ length: rings }, (_, i) => (
        <RippleRing key={i} size={size} color={color} duration={duration} delay={(duration / rings) * i} />
      ))}
    </View>
  );
}

function RippleRing({ size, color, duration, delay }: { size: number; color: string; duration: number; delay: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(v, { toValue: 1, duration, delay, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [v, duration, delay]);
  return (
    <Animated.View
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: color,
        opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
        transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }) }],
      }}
    />
  );
}

/** Yüklenirken parlayıp sönen yer tutucu. */
export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v]);
  return (
    <Animated.View
      style={[
        { backgroundColor: "#DCE8F5", borderRadius: 10 },
        style,
        { opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.95] }) },
      ]}
    />
  );
}

/** Sayı değişince yumuşakça sayarak yeni değere gider (kredi bakiyesi vb.). */
export function AnimatedNumber({
  value,
  style,
  f = "b",
  format,
}: {
  value: number;
  style?: StyleProp<TextStyle>;
  f?: FontKey;
  format?: (n: number) => string;
}) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = from.current;
    if (start === value) return;
    const t0 = Date.now();
    const dur = 650;
    let raf = 0;
    const step = () => {
      const k = Math.min(1, (Date.now() - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      const cur = Math.round(start + (value - start) * e);
      from.current = cur;
      setShown(cur);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <T f={f} style={style}>
      {format ? format(shown) : shown}
    </T>
  );
}

/** Yeşil nabız noktası: "canlı güncelleniyor" göstergesi. */
export function LiveDot({ color = "#22B07D", size = 8 }: { color?: string; size?: number }) {
  return (
    <View style={{ width: size * 2.2, height: size * 2.2, alignItems: "center", justifyContent: "center" }}>
      <View style={{ position: "absolute" }}>
        <Ripple size={size * 2.2} color={color} rings={1} duration={1600} />
      </View>
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
    </View>
  );
}

/** Animasyonlu ilerleme çubuğu (0-1). */
export function ProgressBar({
  ratio,
  color = C.tide,
  track = C.mist,
  height = 6,
}: {
  ratio: number;
  color?: string;
  track?: string;
  height?: number;
}) {
  const v = useRef(new Animated.Value(ratio)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: Math.max(0, Math.min(1, ratio)),
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [ratio, v]);
  return (
    <View style={{ height, borderRadius: height, backgroundColor: track, overflow: "hidden" }}>
      <Animated.View
        style={{
          height,
          borderRadius: height,
          backgroundColor: color,
          width: v.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
        }}
      />
    </View>
  );
}
