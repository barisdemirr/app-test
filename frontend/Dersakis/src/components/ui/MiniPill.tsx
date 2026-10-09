import React from "react";
import { View } from "react-native";
import { C } from "@/theme";
import { T } from "./T";

export function MiniPill({
  label,
  color = C.muted,
  bg = C.foam,
}: {
  label: string;
  color?: string;
  bg?: string;
}) {
  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 5,
      }}
    >
      <T style={{ fontSize: 10, color }}>{label}</T>
    </View>
  );
}