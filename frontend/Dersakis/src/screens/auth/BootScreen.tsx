import React from "react";
import { ActivityIndicator, View } from "react-native";
import { C, G_PRIMARY } from "@/theme";
import { GradBtn, T } from "@/components/ui";

/** Açılışta token doğrulanırken (yükleniyor) ya da sunucuya ulaşılamadığında (yeniden dene). */
export function BootScreen({ offline, onRetry }: { offline: boolean; onRetry: () => void }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: C.foam,
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
      }}
    >
      {offline ? (
        <>
          <T f="h" style={{ fontSize: 20, marginBottom: 8 }}>
            Bağlanılamadı
          </T>
          <T style={{ color: C.muted, fontSize: 13, textAlign: "center", marginBottom: 18 }}>
            Sunucuya ulaşılamıyor. İnternet bağlantını kontrol edip tekrar dene.
          </T>
          <GradBtn label="Tekrar dene" colors={G_PRIMARY} onPress={onRetry} />
        </>
      ) : (
        <ActivityIndicator color={C.tide} />
      )}
    </View>
  );
}
