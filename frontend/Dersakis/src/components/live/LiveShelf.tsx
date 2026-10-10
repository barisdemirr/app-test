import { FloatingDolphin } from "@/components/mascot";
import React from "react";
import { FlatList, View } from "react-native";
import { WifiOff } from "lucide-react-native";
import { C, fin } from "@/theme";
import type { LiveSessionDto } from "@/api/types";
import { Enter, SectionTitle, Skeleton, T } from "@/components/ui";
import { LiveCard } from "./LiveCard";

function SkeletonCard() {
  return (
    <View style={[fin, { width: 286, backgroundColor: "#fff", overflow: "hidden", padding: 15, gap: 12 }]}>
      <Skeleton style={{ height: 80, borderRadius: 16 }} />
      <Skeleton style={{ height: 16, width: "75%" }} />
      <Skeleton style={{ height: 12, width: "95%" }} />
      <Skeleton style={{ height: 12, width: "60%" }} />
      <Skeleton style={{ height: 40, borderRadius: 14 }} />
    </View>
  );
}

/** Ana sayfadaki yatay ilan şeridi. */
export function LiveShelf({
  title,
  action,
  items,
  loading,
  error,
  empty,
  emptyAction,
  onSeeAll,
  onOpen,
  onJoin,
}: {
  title: string;
  action?: string;
  items: LiveSessionDto[];
  loading: boolean;
  /** Liste yüklenemedi (ağ/sunucu): boş durumdan ayrı gösterilir */
  error?: boolean;
  empty: string;
  /** Boş durumda gösterilecek eylem (örn. "＋ Eğitim ver") */
  emptyAction?: React.ReactNode;
  onSeeAll?: () => void;
  onOpen: (id: string) => void;
  onJoin?: (s: LiveSessionDto) => void;
}) {
  return (
    <>
      <SectionTitle title={title} action={items.length > 0 ? action : undefined} onAction={onSeeAll} />
      {loading ? (
        <FlatList
          horizontal
          scrollEnabled={false}
          data={[0, 1]}
          keyExtractor={(i) => String(i)}
          style={{ marginHorizontal: -20 }}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 13 }}
          renderItem={() => <SkeletonCard />}
        />
      ) : error && items.length === 0 ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            padding: 14,
            borderRadius: 16,
            backgroundColor: "#FDECEA",
          }}
        >
          <WifiOff size={18} color={C.error} />
          <T style={{ color: C.error, fontSize: 12, flex: 1 }}>
            Liste yüklenemedi. Ekranı aşağı çekip yenile.
          </T>
        </View>
      ) : items.length === 0 ? (
        <View
          style={{
            padding: 16,
            borderRadius: 18,
            backgroundColor: "#fff",
            borderWidth: 1,
            borderColor: C.mist,
            borderStyle: "dashed",
            gap: 12,
            alignItems: "flex-start",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <FloatingDolphin size={64} />
            <T style={{ color: C.muted, fontSize: 12.5, flex: 1 }}>{empty}</T>
          </View>
          {emptyAction}
        </View>
      ) : (
        <FlatList
          horizontal
          data={items}
          keyExtractor={(i) => i.id}
          showsHorizontalScrollIndicator={false}
          snapToInterval={299}
          decelerationRate="fast"
          style={{ marginHorizontal: -20 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 14, gap: 13 }}
          renderItem={({ item, index }) => (
            <Enter delay={Math.min(index, 4) * 80} y={20}>
              <LiveCard s={item} onOpen={onOpen} onJoin={onJoin} />
            </Enter>
          )}
        />
      )}
    </>
  );
}
