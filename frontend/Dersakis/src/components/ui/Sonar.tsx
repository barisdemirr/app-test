import React from "react";
import { View } from "react-native";

export function Sonar({
  size = 138,
  color = "rgba(255,255,255,.18)",
}: {
  size?: number;
  color?: string;
}) {
  const ring = (s: number) => (
    <View
      key={s}
      style={{
        position: "absolute",
        width: s,
        height: s,
        borderRadius: s / 2,
        borderWidth: 1.5,
        borderColor: color,
      }}
    />
  );
  return (
    <View
      pointerEvents="none"
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {ring(size)}
      {ring(size * 0.76)}
      {ring(size * 0.52)}
    </View>
  );
}