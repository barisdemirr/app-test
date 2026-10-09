import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Share,
  View,
  type LayoutChangeEvent,
  type ViewToken,
} from "react-native";
import { C } from "@/theme";
import type { FeedItem } from "@/api/feed";
import { errorMessage } from "@/api/errors";
import { useAppForeground } from "@/hooks/useAppForeground";
import {
  flattenFeed,
  useFeed,
  useSavedVideos,
  useVideoFlag,
} from "@/queries";
import { buildRows, type FeedRow } from "@/utils/feedRows";
import { ReelCard } from "@/components/reels";
import { GradBtn, Press, T } from "@/components/ui";

export type FeedSource =
  | { kind: "feed" }
  | { kind: "saved"; startId?: string };

export type FeedScreenProps = {
  source: FeedSource;
  courseIds: string[];
  interests: string[];
  topInset: number;
  bottomOffset: number;
  /** Üstte sheet açıkken video durur */
  suspended: boolean;
  onBack: () => void;
  onQuiz: (item: FeedItem) => void;
  showToast: (m: string) => void;
};

const VIEWABILITY = { itemVisiblePercentThreshold: 80 };

function Center({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        gap: 16,
        backgroundColor: C.abyss,
      }}
    >
      {children}
    </View>
  );
}

export function FeedScreen(p: FeedScreenProps) {
  const foreground = useAppForeground();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [dragging, setDragging] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const isFeed = p.source.kind === "feed";
  const startId = p.source.kind === "saved" ? p.source.startId : undefined;
  const feedQ = useFeed(p.courseIds, isFeed);
  const savedQ = useSavedVideos(!isFeed);
  const q = isFeed ? feedQ : savedQ;

  const flag = useVideoFlag();

  const rows: FeedRow[] = useMemo(() => {
    const items = flattenFeed(q.data);
    return isFeed
      ? buildRows(items, p.interests)
      : items.map((item): FeedRow => ({ kind: "video", key: `v:${item.id}`, item }));
  }, [q.data, isFeed, p.interests]);

  // Açılışta hangi satırdan başlanacak (kayıtlı videodan açıldıysa o video).
  // Liste ilk çizildiği anda sabitlenir; sonradan değişmez.
  const startRef = useRef<number | null>(null);
  if (startRef.current === null && size.h > 0 && rows.length > 0) {
    const i = startId
      ? rows.findIndex((r) => r.kind === "video" && r.item.id === startId)
      : 0;
    startRef.current = i < 0 ? 0 : i;
  }
  const startIndex = startRef.current ?? 0;
  const current = activeKey ?? rows[startIndex]?.key ?? null;

  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const k = viewableItems[0]?.key;
    if (k) setActiveKey(String(k));
  }).current;

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) setSize({ w: width, h: height });
  };

  const handlers = {
    onBack: p.onBack,
    onQuiz: p.onQuiz,
    showToast: p.showToast,
    onDragStart: () => setDragging(true),
    onDragEnd: () => setDragging(false),
    onSave: (item: FeedItem) => {
      const active = !item.saved;
      flag.mutate(
        { id: item.id, kind: "save", active },
        { onError: (e) => p.showToast(errorMessage(e)) },
      );
      p.showToast(active ? "Kaydettiklerime eklendi" : "Kaydedilenlerden çıkarıldı");
    },
    onLearn: (item: FeedItem, watched: boolean) => {
      if (!item.learned && !watched) {
        p.showToast("Önce videoyu sonuna kadar izle");
        return;
      }
      flag.mutate(
        { id: item.id, kind: "learned", active: !item.learned },
        { onError: (e) => p.showToast(errorMessage(e)) },
      );
    },
    onShare: (item: FeedItem) => {
      Share.share({ message: `${item.title} — ${item.courseName} | Dersakış` }).catch(
        () => {},
      );
    },
  };

  const loadMore = useCallback(() => {
    if (q.hasNextPage && !q.isFetchingNextPage) q.fetchNextPage();
  }, [q]);

  let body: React.ReactNode = null;
  if (q.isLoading) {
    body = (
      <Center>
        <ActivityIndicator color={C.sun} />
      </Center>
    );
  } else if (q.isError && rows.length === 0) {
    body = (
      <Center>
        <T style={{ color: "#fff", textAlign: "center" }}>{errorMessage(q.error)}</T>
        <GradBtn label="Tekrar dene" onPress={() => q.refetch()} />
      </Center>
    );
  } else if (rows.length === 0) {
    body = (
      <Center>
        <T f="h" style={{ color: "#fff", fontSize: 20, textAlign: "center" }}>
          {isFeed ? "Seçtiğin derslerde henüz video yok" : "Kaydettiğin video yok"}
        </T>
        <T style={{ color: "#BBD3EA", textAlign: "center" }}>
          {isFeed
            ? "Ders seçimini profilinden değiştirebilirsin."
            : "Beğendiğin videoları kaydet, burada bul."}
        </T>
        <Press onPress={p.onBack}>
          <T f="bb" style={{ color: C.sun }}>
            Geri dön
          </T>
        </Press>
      </Center>
    );
  } else if (size.h > 0) {
    body = (
      <FlatList
        data={rows}
        keyExtractor={(r) => r.key}
        extraData={`${current}|${p.suspended}|${foreground}`}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        scrollEnabled={!dragging}
        initialScrollIndex={startIndex}
        getItemLayout={(_, i) => ({ length: size.h, offset: size.h * i, index: i })}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={VIEWABILITY}
        onEndReached={loadMore}
        onEndReachedThreshold={2}
        ListFooterComponent={
          q.isFetchingNextPage ? (
            <View style={{ height: size.h, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator color={C.sun} />
            </View>
          ) : null
        }
        renderItem={({ item: row }) => (
          <ReelCard
            row={row}
            active={row.key === current}
            running={foreground && !p.suspended}
            width={size.w}
            height={size.h}
            topInset={p.topInset}
            bottomOffset={p.bottomOffset}
            {...handlers}
          />
        )}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.abyss }} onLayout={onLayout}>
      {body}
    </View>
  );
}
