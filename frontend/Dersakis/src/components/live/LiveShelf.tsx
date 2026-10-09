import React from "react";
import { FlatList } from "react-native";
import { C } from "@/theme";
import type { LiveSessionDto } from "@/api/types";
import { SectionTitle, T } from "@/components/ui";
import { LiveCard } from "./LiveCard";

/** Ana sayfadaki yatay ilan şeridi. */
export function LiveShelf({
  title,
  action,
  items,
  loading,
  error,
  empty,
  onSeeAll,
  onOpen,
}: {
  title: string;
  action?: string;
  items: LiveSessionDto[];
  loading: boolean;
  /** Liste yüklenemedi (ağ/sunucu): boş durumdan ayrı gösterilir */
  error?: boolean;
  empty: string;
  onSeeAll?: () => void;
  onOpen: (id: string) => void;
}) {
  return (
    <>
      <SectionTitle title={title} action={action} onAction={onSeeAll} />
      {loading ? (
        <T style={{ color: C.muted, fontSize: 12 }}>Yükleniyor…</T>
      ) : error && items.length === 0 ? (
        <T style={{ color: C.error, fontSize: 12 }}>
          Liste yüklenemedi. Ekranı aşağı çekip yenile.
        </T>
      ) : items.length === 0 ? (
        <T style={{ color: C.muted, fontSize: 12 }}>{empty}</T>
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
          renderItem={({ item }) => <LiveCard s={item} onOpen={onOpen} />}
        />
      )}
    </>
  );
}
