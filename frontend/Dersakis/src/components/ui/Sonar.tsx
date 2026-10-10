import React, { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";

/** Dekoratif halkalar. `animated` ile halkalar sırayla nabız atar. */
export function Sonar({
  size = 138,
  color = "rgba(255,255,255,.18)",
  animated = false,
}: {
  size?: number;
  color?: string;
  animated?: boolean;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!animated) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animated, v]);

  const ring = (s: number, i: number) => (
    <Animated.View
      key={s}
      style={{
        position: "absolute",
        width: s,
        height: s,
        borderRadius: s / 2,
        borderWidth: 1.5,
        borderColor: color,
        transform: animated
          ? [
              {
                scale: v.interpolate({
                  inputRange: [0, 1],
                  outputRange: i % 2 === 0 ? [0.94, 1.04] : [1.05, 0.95],
                }),
              },
            ]
          : [],
      }}
    />
  );
  return (
    <View
      pointerEvents="none"
      style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}
    >
      {ring(size, 0)}
      {ring(size * 0.76, 1)}
      {ring(size * 0.52, 2)}
    </View>
  );
}
