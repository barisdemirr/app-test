import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, DIAG, fin, SH } from "@/theme";
import { Press, Sonar, T } from "@/components/ui";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

export function AuthScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<"login" | "register">("login");

  const tab = (id: "login" | "register", label: string) => {
    const on = mode === id;
    return (
      <Press
        onPress={() => setMode(id)}
        style={{
          flex: 1,
          minHeight: 44,
          alignItems: "center",
          justifyContent: "center",
          borderBottomWidth: 2,
          borderBottomColor: on ? C.tide : "transparent",
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
        <LinearGradient
          colors={[C.abyss, C.deep, "#28A6CB"]}
          locations={[0.02, 0.55, 1]}
          {...DIAG}
          style={[fin, { padding: 22, minHeight: 150, overflow: "hidden" }, SH.card]}
        >
          <View style={{ position: "absolute", right: 14, top: 14, opacity: 0.45 }}>
            <Sonar size={110} />
          </View>
          <T f="h" style={{ fontSize: 28, color: "#fff", letterSpacing: -0.7 }}>
            Dersakış
          </T>
          <T style={{ fontSize: 13, color: C.mist, marginTop: 8 }}>
            Bilgiyi yakala, kredi kazan.
          </T>
        </LinearGradient>

        <View style={{ flexDirection: "row", marginTop: 18, marginBottom: 18 }}>
          {tab("login", "Giriş yap")}
          {tab("register", "Kayıt ol")}
        </View>

        {mode === "login" ? (
          <LoginForm />
        ) : (
          <RegisterForm onGoLogin={() => setMode("login")} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
