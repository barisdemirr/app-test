import React from "react";
import { View } from "react-native";
import { C, SH } from "@/theme";
import { useCreditHistory } from "@/queries";
import { creditReasonLabel } from "@/utils/creditReasons";
import { formatDateTime } from "@/utils/time";
import { Chip, SectionTitle, T } from "@/components/ui";

/** Kredi hareketleri (sayfa sayfa). Negatif tutar = harcama. */
export function CreditHistory() {
  const q = useCreditHistory();
  const items = q.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <SectionTitle title="Kredi geçmişi" />
      {q.isLoading ? (
        <T style={{ color: C.muted, fontSize: 12 }}>Yükleniyor…</T>
      ) : items.length === 0 ? (
        <T style={{ color: C.muted, fontSize: 12 }}>Henüz kredi hareketin yok.</T>
      ) : (
        <View style={[{ borderRadius: 17, backgroundColor: "#fff", overflow: "hidden" }, SH.soft]}>
          {items.map((e, i) => (
            <View
              key={`${e.createdAtUtc}-${i}`}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 12,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: C.foam,
                gap: 10,
              }}
            >
              <View style={{ flex: 1 }}>
                <T f="bs" style={{ fontSize: 12 }}>
                  {creditReasonLabel(e.reason)}
                </T>
                <T style={{ color: C.muted, fontSize: 10, marginTop: 2 }}>
                  {formatDateTime(e.createdAtUtc)} · bakiye {e.balanceAfter}
                </T>
              </View>
              <T f="bb" style={{ fontSize: 13, color: e.amount < 0 ? C.coral : C.success }}>
                {e.amount > 0 ? `+${e.amount}` : e.amount}
              </T>
            </View>
          ))}
        </View>
      )}
      {q.hasNextPage && (
        <View style={{ marginTop: 8 }}>
          <Chip onPress={() => q.fetchNextPage()}>
            {q.isFetchingNextPage ? "Yükleniyor…" : "Daha fazla göster"}
          </Chip>
        </View>
      )}
    </>
  );
}
