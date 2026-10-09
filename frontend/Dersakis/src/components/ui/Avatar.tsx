import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { C, DIAG } from "@/theme";
import { T } from "./T";

export function Avatar({
  initials,
  color,
  size = 40,
}: {
  initials: string;
  color: string;
  size?: number;
}) {
  return (
    <LinearGradient
      colors={[color, C.deep]}
      {...DIAG}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,.25)",
      }}
    >
      <T f="bb" style={{ color: "#fff", fontSize: size * 0.32 }}>
        {initials}
      </T>
    </LinearGradient>
  );
}