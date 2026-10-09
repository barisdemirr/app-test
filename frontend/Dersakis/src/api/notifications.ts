import { api, qs } from "./http";

export type NotificationType =
  | "VoiceGuestJoined"
  | "VoiceHostMissed"
  | "VoiceExpired"
  | "LessonBooked"
  | "LessonStarting"
  | "LessonCancelled"
  | "ApprovalRequested"
  | "SessionSettled"
  | "Test";

export type NotificationData = {
  action?: "open_session" | "review_session";
  sessionId?: string;
  kind?: "Voice" | "Lesson";
  scheduledAtUtc?: string;
};

export type AppNotification = {
  id: string;
  type: NotificationType | string;
  title: string;
  body: string;
  data: NotificationData | null;
  createdAtUtc: string;
  readAtUtc: string | null;
};

export type NotificationsPage = {
  items: AppNotification[];
  hasMore: boolean;
  unreadCount: number;
};

/** GET /notifications — uygulama içi kutu (push'tan farklı olarak her zaman güvenilir). */
export const fetchNotifications = (page: number, pageSize = 20) =>
  api<NotificationsPage>("/notifications" + qs({ page, pageSize }));

/** POST /notifications/read — belirli id'ler ya da tümü. */
export const markNotificationsRead = (arg: { ids: string[] } | { all: true }) =>
  api<{ unreadCount: number }>("/notifications/read", { method: "POST", body: arg });

/** PUT /me/devices — her girişte ve token değişince; tekrarı zararsız. En çok 10 cihaz. */
export const registerDeviceToken = (token: string, platform: "ios" | "android") =>
  api<{ registered: boolean; activeDevices: number }>("/me/devices", {
    method: "PUT",
    body: { token, platform },
  });

/** POST /me/devices/unregister — çıkışta çağrılmazsa çıkış yapan kullanıcıya bildirim gider. */
export const unregisterDeviceToken = (token: string) =>
  api("/me/devices/unregister", { method: "POST", body: { token } });
