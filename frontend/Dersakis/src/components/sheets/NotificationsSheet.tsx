import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react-native";
import { C } from "@/theme";
import { errorMessage } from "@/api/errors";
import type { AppNotification } from "@/api/notifications";
import { queryKeys, useMarkRead, useNotifications } from "@/queries";
import { formatDateTime } from "@/utils/time";
import { Chip, Press, Sheet, T } from "@/components/ui";

/** Uygulama içi bildirim kutusu. Açılınca bakiye de tazelenir (arka planda değişmiş olabilir). */
export function NotificationsSheet({
  toast,
  onClose,
  onOpenNotification,
}: {
  toast: string;
  onClose: () => void;
  /** Kayda dokunulunca (canlı oturum varsa ekranına gider) */
  onOpenNotification: (n: AppNotification) => void;
}) {
  const qc = useQueryClient();
  const q = useNotifications();
  const mark = useMarkRead();
  const items = q.data?.pages.flatMap((p) => p.items) ?? [];
  const unread = q.data?.pages[0]?.unreadCount ?? 0;

  useEffect(() => {
    qc.invalidateQueries({ queryKey: queryKeys.balance });
  }, [qc]);

  const open = (n: AppNotification) => {
    if (!n.readAtUtc) mark.mutate({ ids: [n.id] });
    onOpenNotification(n);
  };

  return (
    <Sheet onClose={onClose} toast={toast}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <T f="h" style={{ fontSize: 21, flex: 1 }}>
          Bildirimler
        </T>
        {unread > 0 && (
          <View style={{ marginRight: 8 }}>
            <Chip onPress={() => mark.mutate({ all: true })}>Tümünü okundu yap</Chip>
          </View>
        )}
        <Press
          onPress={onClose}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#fff",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={18} color={C.muted} />
        </Press>
      </View>

      {q.isLoading ? (
        <View style={{ padding: 30, alignItems: "center" }}>
          <ActivityIndicator color={C.tide} />
        </View>
      ) : q.isError ? (
        <T style={{ color: C.error }}>{errorMessage(q.error)}</T>
      ) : items.length === 0 ? (
        <T style={{ color: C.muted, fontSize: 12 }}>Henüz bildirimin yok.</T>
      ) : (
        items.map((n) => (
          <Press
            key={n.id}
            onPress={() => open(n)}
            style={{
              padding: 13,
              borderRadius: 15,
              marginBottom: 8,
              backgroundColor: n.readAtUtc ? "#fff" : "#EAF3FF",
              borderWidth: 1,
              borderColor: n.readAtUtc ? C.mist : "#B9D7FF",
              gap: 3,
            }}
          >
            <T f="bb" style={{ fontSize: 12 }}>
              {n.title}
            </T>
            <T style={{ fontSize: 12, lineHeight: 17 }}>{n.body}</T>
            <T style={{ color: C.muted, fontSize: 10, marginTop: 2 }}>
              {formatDateTime(n.createdAtUtc)}
            </T>
          </Press>
        ))
      )}
      {q.hasNextPage && (
        <Chip onPress={() => q.fetchNextPage()}>
          {q.isFetchingNextPage ? "Yükleniyor…" : "Daha fazla göster"}
        </Chip>
      )}
    </Sheet>
  );
}
