import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { DIAG, G_PRIMARY } from "@/theme";

/** Dersakış işareti: dalga çizgili gradyan kare. */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <LinearGradient
      colors={G_PRIMARY}
      {...DIAG}
      style={{
        width: size,
        height: size,
        borderTopLeftRadius: size / 2,
        borderTopRightRadius: size / 2,
        borderBottomRightRadius: size / 2,
        borderBottomLeftRadius: size * 0.18,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={size * 0.57} height={size * 0.36} viewBox="0 0 16 10">
        <Path
          d="M1 6 Q4 0 8 5 T15 4"
          stroke="#fff"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
    </LinearGradient>
  );
}
