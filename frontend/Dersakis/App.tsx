import React from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import {
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
} from "@expo-google-fonts/bricolage-grotesque";
import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold,
} from "@expo-google-fonts/instrument-sans";

import { C } from "@/theme";
import { AppProvider } from "@/contexts";
import { AuthProvider, useAuth } from "@/auth";
import { AuthScreen, BootScreen } from "@/screens/auth";
import { AppShell } from "@/AppShell";
import { emptyQ } from "@/screens";

function Root() {
  const { status, user, retry } = useAuth();

  if (status === "loading" || status === "offline") {
    return <BootScreen offline={status === "offline"} onRetry={retry} />;
  }
  if (status === "signedOut" || !user) {
    return <AuthScreen />;
  }
  // key={user.id}: kullanıcı değişince tüm uygulama durumu sıfırdan başlar
  return (
    <AppProvider key={user.id} emptyQ={emptyQ}>
      <AppShell />
    </AppProvider>
  );
}

export default function App() {
  const [loaded, error] = useFonts({
    BricolageGrotesque_500Medium,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    InstrumentSans_700Bold,
  });

  if (!loaded && !error) {
    return <View style={{ flex: 1, backgroundColor: C.foam }} />;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
