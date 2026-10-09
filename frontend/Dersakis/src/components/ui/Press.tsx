import React from "react";
import {
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from "react-native";

export type PressProps = Omit<PressableProps, "style" | "children"> & {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

export function Press({ style, children, disabled, ...rest }: PressProps) {
  return (
    <Pressable
      disabled={disabled}
      {...rest}
      style={({ pressed }) => [
        style,
        pressed &&
          !disabled && { transform: [{ scale: 0.97 }], opacity: 0.92 },
      ]}
    >
      {children}
    </Pressable>
  );
}