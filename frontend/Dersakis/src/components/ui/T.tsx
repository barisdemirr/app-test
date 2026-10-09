import React from "react";
import { Text, TextProps } from "react-native";
import { FONT, FontKey } from "@/theme";
import { C } from "@/theme";

export function T({
  f = "b",
  style,
  ...p
}: TextProps & { f?: FontKey }) {
  return (
    <Text
      {...p}
      style={[{ fontFamily: FONT[f], color: C.ink, fontSize: 14 }, style]}
    />
  );
}