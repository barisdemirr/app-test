import React, { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import { C, shadow } from "@/theme";
import { Press } from "@/components/ui/Press";
import { Dolphin } from "@/components/mascot";

const SIZE = 60;

/**
 * Ana ekranın sağ altında duran Dolphy baloncuğu: yunus yavaşça sallanır, halka nabız gibi yayılır.
 * Sadece native-driver destekli dönüşümler (translate/scale/opacity/rotate) kullanılır.
 */
export function AiFab({ onPress, bottom }: { onPress: () => void; bottom: number }) {
  const bob = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const b = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    const r = Animated.loop(
      Animated.timing(ring, { toValue: 1, duration: 2200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    );
    b.start();
    r.start();
    return () => {
      b.stop();
      r.stop();
    };
  }, [bob, ring]);

  const dy = bob.interpolate({ inputRange: [0, 1], outputRange: [2, -3] });
  const tilt = bob.interpolate({ inputRange: [0, 1], outputRange: ["-6deg", "6deg"] });
  const ringScale = ring.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] });
  const ringOpacity = ring.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.45, 0] });

  return (
    <View
      pointerEvents="box-none"
      style={{ position: "absolute", right: 16, bottom, width: SIZE, height: SIZE }}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE / 2,
          backgroundColor: C.lagoon,
          opacity: ringOpacity,
          transform: [{ scale: ringScale }],
        }}
      />
      <Press
        onPress={onPress}
        scaleTo={0.9}
        accessibilityRole="button"
        accessibilityLabel="Dolphy çalışma koçunu aç"
        style={[
          {
            width: SIZE,
            height: SIZE,
            borderRadius: SIZE / 2,
            backgroundColor: C.pearl,
            borderWidth: 2,
            borderColor: C.mist,
            alignItems: "center",
            justifyContent: "center",
          },
          shadow(0.22, 14, 6),
        ]}
      >
        <Animated.View style={{ transform: [{ translateY: dy }, { rotate: tilt }] }}>
          <Dolphin size={42} mood="smile" />
        </Animated.View>
      </Press>
    </View>
  );
}
