import React from "react";
import { StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { C, DIAG, G_PRIMARY } from "@/theme";
import { Press } from "./Press";
import { T } from "./T";

export function Chip({
  children,
  active = false,
  onPress,
}: {
  children: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Press
      onPress={onPress}
      style={{
        minHeight: 40,
        paddingHorizontal: 14,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? C.tide : C.mist,
        backgroundColor: "#fff",
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {active && (
        <LinearGradient
          colors={G_PRIMARY}
          {...DIAG}
          style={StyleSheet.absoluteFill}
        />
      )}
      <T f="bs" style={{ fontSize: 12, color: active ? "#fff" : C.muted }}>
        {children}
      </T>
    </Press>
  );
}