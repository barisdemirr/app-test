import React from "react";
import { View } from "react-native";
import { Dolphin } from "@/components/mascot/Dolphin";

/** Dolphora işareti: yuvarlak köşeli açık zemin üstünde yunus maskotu. */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.34,
        backgroundColor: "#E6F4FF",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <Dolphin size={size * 0.92} mood="smile" />
    </View>
  );
}
