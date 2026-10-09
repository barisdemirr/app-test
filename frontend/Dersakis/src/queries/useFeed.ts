import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchFeed, fetchSavedVideos } from "@/api/feed";
import { queryKeys } from "./keys";

type Cursor = number | string | undefined;

/** Sonsuz kaydırmalı feed. Sayfalama cursor'la; kayıt atlamaz/tekrarlamaz. */
export function useFeed(courseIds: string[], enabled = true) {
  return useInfiniteQuery({
    queryKey: queryKeys.feed(courseIds),
    enabled,
    initialPageParam: undefined as Cursor,
    queryFn: ({ pageParam }) => fetchFeed({ courseIds, cursor: pageParam }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

/** Kaydettiğim videolar. Profil açılınca ve kaydetme değişince taze olsun. */
export function useSavedVideos(enabled = true) {
  return useInfiniteQuery({
    queryKey: queryKeys.savedVideos,
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
    initialPageParam: undefined as Cursor,
    queryFn: ({ pageParam }) => fetchSavedVideos({ cursor: pageParam }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}
