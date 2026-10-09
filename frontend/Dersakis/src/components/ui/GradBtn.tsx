import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { C, fin, G_CORAL, G2, HORZ } from "@/theme";
import { Press } from "./Press";
import { T } from "./T";

export function GradBtn({
  label,
  onPress,
  colors = G_CORAL,
  textColor = "#fff",
  disabled,
  style,
  radius = fin,
  small,
  icon,
}: {
  label: string;
  onPress?: () => void;
  colors?: G2;
  textColor?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  radius?: ViewStyle;
  small?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <Press
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          minHeight: small ? 40 : 48,
          overflow: "hidden",
          justifyContent: "center",
        },
        radius,
        style,
      ]}
    >
      <LinearGradient
        colors={disabled ? (["#C3CFDD", "#C3CFDD"] as G2) : colors}
        {...HORZ}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={{
          paddingHorizontal: small ? 14 : 18,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        {icon}
        <T
          f="bb"
          style={{
            color: disabled ? "#8596AB" : textColor,
            fontSize: small ? 12 : 14,
          }}
        >
          {label}
        </T>
      </View>
    </Press>
  );
}