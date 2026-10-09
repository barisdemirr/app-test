import React from "react";
import { View } from "react-native";
import { C, SH } from "@/theme";
import { T } from "./T";

export function Toast({ text, bottom }: { text: string; bottom: number }) {
  if (!text) return null;
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 40,
        right: 40,
        bottom,
        alignItems: "center",
        zIndex: 50,
      }}
    >
      <View
        style={[
          {
            minHeight: 40,
            paddingHorizontal: 16,
            borderRadius: 999,
            backgroundColor: C.abyss,
            alignItems: "center",
            justifyContent: "center",
          },
          SH.float,
        ]}
      >
        <T f="bs" style={{ color: "#fff", fontSize: 12 }}>
          {text}
        </T>
      </View>
    </View>
  );
}