import React from "react";
import { View } from "react-native";
import { WifiOff } from "lucide-react-native";
import { C, G_PRIMARY } from "@/theme";
import { API_ORIGIN } from "@/config";
import { FloatingDolphin } from "@/components/mascot";
import { Enter, GradBtn, Press, Ripple, T } from "@/components/ui";

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
        <Enter style={{ alignItems: "center" }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 22,
              backgroundColor: "#FDECEA",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <WifiOff size={28} color={C.error} />
          </View>
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
        </Enter>
      ) : (
        <View style={{ alignItems: "center", justifyContent: "center", width: 120, height: 120 }}>
          <View style={{ position: "absolute" }}>
            <Ripple size={120} color={C.tide} rings={2} />
          </View>
          <FloatingDolphin size={92} mood="joy" />
        </View>
      )}
    </View>
  );
}
