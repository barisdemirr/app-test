import React, { useEffect, useRef, useState } from "react";
import { Animated, KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, DIAG, fin, SH } from "@/theme";
import { Enter, Logo, Press, Sonar, T } from "@/components/ui";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

export function AuthScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<"login" | "register">("login");

  const [tabW, setTabW] = useState(0);
  const slide = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(slide, {
      toValue: mode === "login" ? 0 : 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 8,
    }).start();
  }, [mode, slide]);

  const tab = (id: "login" | "register", label: string) => {
    const on = mode === id;
    return (
      <Press
        onPress={() => setMode(id)}
        scaleTo={0.97}
        style={{
          flex: 1,
          minHeight: 44,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <T f={on ? "bb" : "bm"} style={{ color: on ? C.tide : C.muted }}>
          {label}
        </T>
      </Press>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.foam }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 20,
        }}
      >
        <Enter y={12}>
        <LinearGradient
          colors={[C.abyss, C.deep, "#28A6CB"]}
          locations={[0.02, 0.55, 1]}
          {...DIAG}
          style={[fin, { padding: 22, minHeight: 170, overflow: "hidden" }, SH.card]}
        >
          <View style={{ position: "absolute", right: 14, top: 14, opacity: 0.45 }}>
            <Sonar size={110} animated />
          </View>
          <Logo size={40} />
          <T f="h" style={{ fontSize: 28, color: "#fff", letterSpacing: -0.7, marginTop: 14 }}>
            Dersakış
          </T>
          <T style={{ fontSize: 13, color: C.mist, marginTop: 6 }}>
            Bilgiyi yakala, kredi kazan.
          </T>
        </LinearGradient>
        </Enter>

        <View
          style={{ flexDirection: "row", marginTop: 18, marginBottom: 18 }}
          onLayout={(e) => setTabW(e.nativeEvent.layout.width / 2)}
        >
          {tab("login", "Giriş yap")}
          {tab("register", "Kayıt ol")}
          <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 2, backgroundColor: C.mist }} />
          <Animated.View
            style={{
              position: "absolute",
              left: 0,
              bottom: 0,
              height: 2,
              width: tabW,
              backgroundColor: C.tide,
              transform: [{ translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [0, tabW] }) }],
            }}
          />
        </View>

        <Enter key={mode} y={12} duration={340}>
          {mode === "login" ? (
            <LoginForm />
          ) : (
            <RegisterForm onGoLogin={() => setMode("login")} />
          )}
        </Enter>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
