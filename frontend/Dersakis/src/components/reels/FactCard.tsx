import React from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft } from "lucide-react-native";
import { C, DIAG } from "@/theme";
import type { Fact } from "@/constants/facts";
import { GridBg, Press, Sonar, T } from "@/components/ui";

/** "Biliyor muydun?" — istemci kartı, kredi vermez. */
export function FactCard({
  fact,
  width,
  height,
  topInset,
  bottomOffset,
  onBack,
}: {
  fact: Fact;
  width: number;
  height: number;
  topInset: number;
  bottomOffset: number;
  onBack: () => void;
}) {
  return (
    <View style={{ width, height, overflow: "hidden" }}>
      <LinearGradient
        colors={[C.abyss, C.deep, "#164B83"]}
        {...DIAG}
        style={StyleSheet.absoluteFill}
      />
      <GridBg />
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 18,
          right: 40,
          top: topInset + 90,
          bottom: bottomOffset + 90,
          justifyContent: "center",
        }}
      >
        <View style={{ position: "absolute", alignSelf: "center", opacity: 0.25 }}>
          <Sonar size={230} />
        </View>
        <T f="bb" style={{ color: C.sun, letterSpacing: 2, fontSize: 12 }}>
          BİLİYOR MUYDUN?
        </T>
        <T f="h" style={{ color: "#fff", fontSize: 29, lineHeight: 34, marginTop: 18 }}>
          {fact.text}
        </T>
        <T style={{ color: "#BBD3EA", fontSize: 12, marginTop: 24 }}>
          Bu kart kredi vermez, kaydırarak geçebilirsin
        </T>
      </View>
      <Press
        onPress={onBack}
        style={{
          position: "absolute",
          top: topInset + 10,
          left: 13,
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: "rgba(255,255,255,.14)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ArrowLeft size={19} color="#fff" />
      </Press>
    </View>
  );
}
