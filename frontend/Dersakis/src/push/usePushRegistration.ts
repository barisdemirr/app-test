import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { useQueryClient } from "@tanstack/react-query";
import { useAppForeground } from "@/hooks/useAppForeground";
import type { NotificationData } from "@/api/notifications";
import { registerForPush } from "./device";

/**
 * Giriş yapılmışken: cihazı kaydet (açılışta ve öne gelince; token değişmiş olabilir),
 * gelen bildirimde ilgili sorguları tazele, dokunulunca `onOpen` çağır.
 */
export function usePushRegistration(onOpen: (d: NotificationData) => void) {
  const qc = useQueryClient();
  const foreground = useAppForeground();
  const asked = useRef(false);
  const openRef = useRef(onOpen);
  openRef.current = onOpen;

  useEffect(() => {
    if (!foreground) return;
    // izin penceresi oturum başına yalnızca bir kez çıkar
    const ask = !asked.current;
    asked.current = true;
    registerForPush(ask).catch(() => {});
  }, [foreground]);

  useEffect(() => {
    const refresh = (d?: NotificationData | null) => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["balance"] });
      if (d?.sessionId) qc.invalidateQueries({ queryKey: ["live"] });
    };

    const received = Notifications.addNotificationReceivedListener((n) =>
      refresh(n.request.content.data as NotificationData),
    );
    const tapped = Notifications.addNotificationResponseReceivedListener((r) => {
      const d = r.notification.request.content.data as NotificationData;
      refresh(d);
      openRef.current(d);
    });

    // Uygulama bildirimle açıldıysa
    Notifications.getLastNotificationResponseAsync().then((r) => {
      if (r) openRef.current(r.notification.request.content.data as NotificationData);
    });

    return () => {
      received.remove();
      tapped.remove();
    };
  }, [qc]);
}
