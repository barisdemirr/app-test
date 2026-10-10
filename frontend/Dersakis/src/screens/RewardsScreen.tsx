import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Gem } from "lucide-react-native";
import { C, DIAG, fin, SH } from "@/theme";
import * as Clipboard from "expo-clipboard";
import { errorMessage } from "@/api/errors";
import type { RewardItem } from "@/api/rewards";
import { useRedemptions, useRewards } from "@/queries";
import { formatDateTime } from "@/utils/time";
import { RedeemSheet } from "@/components/sheets";
import { Chip, GradBtn, SectionTitle, Sonar, Skeleton, T } from "@/components/ui";

export type RewardsScreenProps = {
  credits: number;
  bodyPad: number;
  toast: string;
  showToast: (m: string) => void;
};

export function RewardsScreen(p: RewardsScreenProps) {
  const rewardsQ = useRewards();
  const redemptionsQ = useRedemptions();
  const [selected, setSelected] = useState<RewardItem | null>(null);
  const items = rewardsQ.data?.items ?? [];
  const elig = rewardsQ.data?.eligibility;
  const mine = redemptionsQ.data?.pages.flatMap((pg) => pg.items) ?? [];

  const stockText = (r: RewardItem) =>
    r.stockRemaining == null ? "" : ` · ${r.stockRemaining} adet kaldı`;
  const scrollProps = {
    showsVerticalScrollIndicator: false,
    keyboardShouldPersistTaps: "handled" as const,
    automaticallyAdjustKeyboardInsets: true,
    contentContainerStyle: {
      paddingHorizontal: 20,
      paddingBottom: p.bodyPad,
    },
  };

  return (
    <ScrollView {...scrollProps}>
      <T f="h" style={{ fontSize: 24, marginTop: 9, marginBottom: 15 }}>
        Premium ödüller
      </T>
      <LinearGradient
        colors={[C.abyss, C.deep, "#24A3C2"]}
        locations={[0, 0.65, 1]}
        {...DIAG}
        style={[
          fin,
          { padding: 20, paddingVertical: 21, overflow: "hidden" },
          SH.card,
        ]}
      >
        <View
          style={{ position: "absolute", right: 15, top: 10, opacity: 0.45 }}
        >
          <Sonar size={120} />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <LinearGradient
            colors={["#FFECA9", "#FFCA61"]}
            {...DIAG}
            style={{
              width: 38,
              height: 38,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <T f="bb" style={{ fontSize: 18, color: "#825A17" }}>
              ✦
            </T>
          </LinearGradient>
          <View>
            <T style={{ fontSize: 11, color: "#BBD8F2" }}>DERSAKIŞ CÜZDANIN</T>
            <T f="h" style={{ fontSize: 21, color: "#fff" }}>
              Bakiyen: {p.credits} kredi
            </T>
          </View>
        </View>
        <T style={{ color: "#D3E7FB", fontSize: 11, marginTop: 15 }}>
          Bilgiyi yakala, güzel şeylerin kilidini aç.
        </T>
      </LinearGradient>

      {elig?.eligibleAtUtc && (
        <T style={{ color: C.coral, fontSize: 12, marginTop: 12 }}>
          Hesabın {formatDateTime(elig.eligibleAtUtc)} tarihinde ödül almaya hazır olacak.
        </T>
      )}

      <SectionTitle title="Senin için seçtik" />
      {rewardsQ.isLoading ? (
        <View style={{ gap: 8 }}><Skeleton style={{ height: 52, borderRadius: 14 }} /><Skeleton style={{ height: 52, borderRadius: 14 }} /></View>
      ) : rewardsQ.isError ? (
        <View style={{ gap: 10 }}>
          <T style={{ color: C.error, fontSize: 12 }}>{errorMessage(rewardsQ.error)}</T>
          <GradBtn label="Tekrar dene" small onPress={() => rewardsQ.refetch()} />
        </View>
      ) : items.length === 0 ? (
        <T style={{ color: C.muted, fontSize: 12 }}>Şu an ödül yok.</T>
      ) : (
        <View style={{ gap: 10 }}>
          {items.map((r) => {
            const can = r.available && p.credits >= r.cost && !elig?.eligibleAtUtc;
            return (
              <View
                key={r.id}
                style={[
                  {
                    borderRadius: 18,
                    minHeight: 88,
                    padding: 13,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    backgroundColor: "#fff",
                    borderWidth: 1,
                    borderColor: C.mist,
                    opacity: r.available ? 1 : 0.6,
                  },
                  SH.soft,
                ]}
              >
                <LinearGradient
                  colors={[C.tide, C.lagoon]}
                  {...DIAG}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Gem size={22} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <T f="bb" style={{ fontSize: 13, lineHeight: 17 }}>
                    {r.title}
                  </T>
                  <T style={{ color: C.muted, fontSize: 10, marginTop: 5 }}>
                    {r.provider}
                    {stockText(r)}
                    {r.redeemedByMe > 0 ? ` · ${r.redeemedByMe}/${r.perUserLimit} aldın` : ""}
                  </T>
                  {!r.available && (
                    <T style={{ color: C.coral, fontSize: 10, marginTop: 3 }}>
                      {r.stockRemaining === 0 ? "Stok tükendi" : "Limitin doldu"}
                    </T>
                  )}
                </View>
                <GradBtn
                  label={`${r.cost} ✦`}
                  small
                  disabled={!can}
                  radius={{ borderRadius: 999 }}
                  onPress={() => can && setSelected(r)}
                />
              </View>
            );
          })}
        </View>
      )}

      <SectionTitle title="Aldığım ödüller" />
      {redemptionsQ.isLoading ? (
        <View style={{ gap: 8 }}><Skeleton style={{ height: 52, borderRadius: 14 }} /><Skeleton style={{ height: 52, borderRadius: 14 }} /></View>
      ) : mine.length === 0 ? (
        <T style={{ color: C.muted, fontSize: 12 }}>Henüz ödül almadın.</T>
      ) : (
        <View style={{ gap: 8 }}>
          {mine.map((m) => (
            <View
              key={m.id}
              style={[
                { padding: 13, borderRadius: 15, backgroundColor: "#fff", gap: 4 },
                SH.soft,
              ]}
            >
              <T f="bb" style={{ fontSize: 12 }}>
                {m.title}
              </T>
              <T style={{ color: C.muted, fontSize: 10 }}>
                {m.provider} · {formatDateTime(m.createdAtUtc)}
              </T>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 }}>
                <T f="h" selectable style={{ fontSize: 15, letterSpacing: 1.5, color: C.tide, flex: 1 }}>
                  {m.code}
                </T>
                <Chip
                  onPress={async () => {
                    await Clipboard.setStringAsync(m.code);
                    p.showToast("Kod kopyalandı");
                  }}
                >
                  Kopyala
                </Chip>
              </View>
            </View>
          ))}
          {redemptionsQ.hasNextPage && (
            <Chip onPress={() => redemptionsQ.fetchNextPage()}>
              {redemptionsQ.isFetchingNextPage ? "Yükleniyor…" : "Daha fazla göster"}
            </Chip>
          )}
        </View>
      )}
      <T
        style={{
          textAlign: "center",
          color: C.muted,
          fontSize: 10,
          lineHeight: 15,
          marginVertical: 16,
          marginHorizontal: 12,
        }}
      >
        Ödüller kupon kodu üretir; teslimat bu kodla yapılır.
      </T>

      {selected && (
        <RedeemSheet
          reward={selected}
          credits={p.credits}
          toast={p.toast}
          onClose={() => setSelected(null)}
          showToast={p.showToast}
        />
      )}
    </ScrollView>
  );
}