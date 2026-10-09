import React, { useCallback, useEffect, useState } from "react";
import { Linking, View } from "react-native";
import { C, SH } from "@/theme";
import { useAppForeground } from "@/hooks/useAppForeground";
import { getPushPermission, registerForPush, type PushPermission } from "@/push";
import { GradBtn, SectionTitle, T } from "@/components/ui";

/** Bildirim izni durumu. Reddedildiyse sistem ayarlarına yönlendirir (rapor 9.6). */
export function NotificationSettings() {
  const foreground = useAppForeground();
  const [perm, setPerm] = useState<PushPermission | null>(null);

  const refresh = useCallback(() => {
    getPushPermission().then(setPerm).catch(() => {});
  }, []);
  // ayarlardan dönünce durum yenilensin
  useEffect(() => {
    if (foreground) refresh();
  }, [foreground, refresh]);

  if (perm === null) return null;

  return (
    <>
      <SectionTitle title="Bildirimler" />
      <View style={[{ padding: 14, borderRadius: 17, backgroundColor: "#fff", gap: 10 }, SH.soft]}>
        <T style={{ color: perm === "granted" ? C.success : C.muted, fontSize: 12, lineHeight: 17 }}>
          {perm === "granted"
            ? "Bildirimler açık. Canlı görüşme ve ödeme haberlerini anında alırsın."
            : "Bildirimler kapalı. Uygulama içi bildirim kutusu yine çalışır, ama canlı görüşmeleri kaçırabilirsin."}
        </T>
        {perm !== "granted" && (
          <GradBtn
            label="Bildirimleri aç"
            small
            onPress={async () => {
              if (perm === "denied") await Linking.openSettings();
              else {
                await registerForPush(true).catch(() => null);
                refresh();
              }
            }}
          />
        )}
      </View>
    </>
  );
}
