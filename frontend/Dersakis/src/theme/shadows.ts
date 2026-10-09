import type { ViewStyle } from "react-native";
import { C } from "./colors";

export const shadow = (
  opacity: number,
  radius: number,
  y: number,
  color: string = C.abyss,
): ViewStyle => ({
  shadowColor: color,
  shadowOpacity: opacity,
  shadowRadius: radius,
  shadowOffset: { width: 0, height: y },
  elevation: Math.max(1, Math.round(radius / 2)),
});

export const SH = {
  card: shadow(0.1, 14, 8, C.deep),
  soft: shadow(0.08, 9, 4),
  float: shadow(0.2, 18, 10),
};