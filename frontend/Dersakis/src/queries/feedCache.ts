import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { FeedItem, FeedPage } from "@/api/feed";

type FeedData = InfiniteData<FeedPage>;

/** Bir videonun bayraklarını (saved/learned/watchCompleted) tüm feed önbelleklerinde günceller. */
export function patchFeedItem(qc: QueryClient, id: string, patch: Partial<FeedItem>) {
  const upd = (data?: FeedData): FeedData | undefined =>
    data && {
      ...data,
      pages: data.pages.map((p) => ({
        ...p,
        items: p.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
      })),
    };
  qc.setQueriesData<FeedData>({ queryKey: ["feed"] }, upd);
  qc.setQueriesData<FeedData>({ queryKey: ["saved-videos"] }, upd);
}

/** Sayfaları düzleştirir, yinelenen id'leri ayıklar. */
export function flattenFeed(data?: FeedData): FeedItem[] {
  const seen = new Set<string>();
  const out: FeedItem[] = [];
  for (const page of data?.pages ?? []) {
    for (const it of page.items) {
      if (!seen.has(it.id)) {
        seen.add(it.id);
        out.push(it);
      }
    }
  }
  return out;
}
