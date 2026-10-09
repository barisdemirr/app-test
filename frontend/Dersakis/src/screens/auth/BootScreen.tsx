import React from "react";
import { ActivityIndicator, View } from "react-native";
import { C, G_PRIMARY } from "@/theme";
import { API_ORIGIN } from "@/config";
import { GradBtn, Press, T } from "@/components/ui";

/** Açılışta token doğrulanırken (yükleniyor) ya da sunucuya ulaşılamadığında (yeniden dene). */
export function BootScreen({
  offline,
  onRetry,
  onSignOut,
}: {
  offline: boolean;
  onRetry: () => void;
  /** Sunucuya hiç ulaşılamıyorsa kullanıcı oturumdan çıkıp başka hesapla deneyebilsin */
  onSignOut?: () => void;
}) {
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
          {__DEV__ && (
            <T style={{ color: C.muted, fontSize: 11, textAlign: "center", marginBottom: 14 }}>
              Sunucu adresi: {API_ORIGIN}
            </T>
          )}
          <GradBtn label="Tekrar dene" colors={G_PRIMARY} onPress={onRetry} />
          {onSignOut && (
            <Press onPress={onSignOut} style={{ padding: 14 }}>
              <T f="bb" style={{ color: C.muted, fontSize: 12 }}>
                Çıkış yap
              </T>
            </Press>
          )}
        </>
      ) : (
        <ActivityIndicator color={C.tide} />
      )}
    </View>
  );
}
