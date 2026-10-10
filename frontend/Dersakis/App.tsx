import React, { useEffect, useState } from "react";
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
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/auth";
import { queryClient, useAppFocus } from "@/queries";
import { AuthScreen, BootScreen } from "@/screens/auth";
import { WelcomeFlow } from "@/screens/welcome";
import { hasSeenWelcome } from "@/utils/welcome";
import { AppShell } from "@/AppShell";
import { MascotProvider } from "@/components/mascot";
import { emptyQ } from "@/screens";

function Root() {
  const { status, user, retry, signOut } = useAuth();
  // Karşılama akışı yalnızca cihazdaki ilk açılışta (girişten önce) gösterilir
  const [welcomed, setWelcomed] = useState<boolean | null>(null);
  useEffect(() => {
    hasSeenWelcome().then(setWelcomed);
  }, []);

  if (status === "loading" || status === "offline") {
    return <BootScreen offline={status === "offline"} onRetry={retry} onSignOut={signOut} />;
  }
  if (status === "signedOut" || !user) {
    if (welcomed === null) return <View style={{ flex: 1, backgroundColor: C.abyss }} />;
    if (!welcomed) return <WelcomeFlow onDone={() => setWelcomed(true)} />;
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
  useAppFocus();
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
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MascotProvider>
            <Root />
          </MascotProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
