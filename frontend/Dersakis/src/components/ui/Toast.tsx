import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, View } from "react-native";
import { C, SH } from "@/theme";
import { T } from "./T";

/** Alttan yukarı kayarak girer, süre dolunca aşağı kayarak çıkar. */
export function Toast({ text, bottom }: { text: string; bottom: number }) {
  const [shown, setShown] = useState(text);
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (text) {
      setShown(text);
      Animated.timing(v, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(v, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => finished && setShown(""));
    }
  }, [text, v]);

  if (!shown) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 24,
        right: 24,
        bottom,
        alignItems: "center",
        zIndex: 50,
        opacity: v,
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
      }}
    >
      <View
        style={[
          {
            minHeight: 42,
            maxWidth: "100%",
            paddingHorizontal: 18,
            paddingVertical: 10,
            borderRadius: 22,
            backgroundColor: C.abyss,
            alignItems: "center",
            justifyContent: "center",
          },
          SH.float,
        ]}
      >
        <T f="bs" style={{ color: "#fff", fontSize: 12, lineHeight: 17, textAlign: "center" }}>
          {shown}
        </T>
      </View>
    </Animated.View>
  );
}
