import React, { useRef } from "react";
import {
  Animated,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from "react-native";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PressProps = Omit<PressableProps, "style" | "children"> & {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  /** Basılıyken küçülme oranı (varsayılan 0.965) */
  scaleTo?: number;
};

/** Yaylanan basma geri bildirimi: bırakınca hafifçe "zıplar". Yerleşim stilleri aynen korunur. */
export function Press({
  style,
  children,
  disabled,
  scaleTo = 0.965,
  onPressIn,
  onPressOut,
  ...rest
}: PressProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const go = (to: number, bounce: number) =>
    Animated.spring(scale, {
      toValue: to,
      useNativeDriver: true,
      speed: 46,
      bounciness: bounce,
    }).start();

  return (
    <AnimatedPressable
      disabled={disabled}
      {...rest}
      onPressIn={(e) => {
        if (!disabled) go(scaleTo, 0);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        go(1, 10);
        onPressOut?.(e);
      }}
      style={[style, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}
