import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { registerDeviceToken, unregisterDeviceToken } from "@/api/notifications";
import { EAS_PROJECT_ID } from "@/config";
import { onSignOut } from "@/auth/session";

// Ön plandayken de banner göster (liste de güncellensin)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let currentToken: string | null = null;

export type PushPermission = "granted" | "denied" | "undetermined";

export async function getPushPermission(): Promise<PushPermission> {
  const p = await Notifications.getPermissionsAsync();
  if (p.status === "granted") return "granted";
  // iOS'ta bir kez reddedilince tekrar sorulamaz: ayarlara yönlendirilir
  return p.status === "denied" && !p.canAskAgain ? "denied" : "undetermined";
}

/**
 * İzin iste (gerekirse) → Expo push token al → sunucuya kaydet.
 * İzin yoksa/simülatörse null döner: uygulama yine çalışır, uygulama içi kutu var.
 */
export async function registerForPush(askPermission: boolean): Promise<string | null> {
  if (!Device.isDevice) return null; // simülatörde token yok

  if (Platform.OS === "android") {
    // Android 8+: sunucu channelId = "live" gönderir; kanal yoksa bildirim görünmez
    await Notifications.setNotificationChannelAsync("live", {
      name: "Canlı görüşmeler",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted" && askPermission) {
    ({ status } = await Notifications.requestPermissionsAsync());
  }
  if (status !== "granted") return null;

  const { data: token } = await Notifications.getExpoPushTokenAsync(
    EAS_PROJECT_ID ? { projectId: EAS_PROJECT_ID } : undefined,
  );
  await registerDeviceToken(token, Platform.OS === "ios" ? "ios" : "android");
  currentToken = token;
  return token;
}

// Çıkışta (token silinmeden ÖNCE) cihazı sunucudan düşür
onSignOut(async () => {
  if (!currentToken) return;
  const t = currentToken;
  currentToken = null;
  try {
    await unregisterDeviceToken(t);
  } catch {
    // ağ yoksa çıkış yine de yapılır; sunucu geçersiz token'ı zamanla temizler
  }
});
