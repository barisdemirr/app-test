import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { C } from "@/theme";
import { T } from "./T";

export function FadeLine({
  on,
  highlight,
  text,
}: {
  on: boolean;
  highlight: boolean;
  text: string;
}) {
  const v = useRef(new Animated.Value(on ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(v, {
      toValue: on ? 1 : 0,
      duration: 380,
      useNativeDriver: true,
    }).start();
  }, [on, v]);

  const opacity = v.interpolate({
    inputRange: [0, 1],
    outputRange: [0.12, 1],
  });
  const translateY = v.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
        marginBottom: 12,
        alignSelf: "flex-start",
      }}
    >
      {highlight ? (
        <View
          style={{
            backgroundColor: C.sun,
            borderRadius: 12,
            paddingHorizontal: 10,
            paddingVertical: 5,
          }}
        >
          <T f="hm" style={{ fontSize: 24, lineHeight: 30, color: C.abyss }}>
            {text}
          </T>
        </View>
      ) : (
        <T f="hm" style={{ fontSize: 24, lineHeight: 30, color: "#fff" }}>
          {text}
        </T>
      )}
    </Animated.View>
  );
}