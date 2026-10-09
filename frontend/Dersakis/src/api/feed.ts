import { api, qs } from "./http";
import type { CursorPage } from "./types";

export type FeedItem = {
  id: string;
  title: string;
  topic: string;
  courseId: string;
  courseName: string;
  creatorId: string;
  creatorName: string;
  creatorAvatarUrl: string | null;
  isMine: boolean;
  durationMs: number;
  questionCount: number;
  watchCompleted: boolean;
  saved: boolean;
  learned: boolean;
  /** Göreli yol: absoluteUrl(streamUrl) ile tam URL yapılır */
  streamUrl: string;
};

export type FeedPage = CursorPage<FeedItem>;

type PageArgs = { cursor?: number | string; limit?: number };

/**
 * GET /feed — seçili dersler OTOMATİK uygulanmaz, courseIds'i biz ekleriz.
 * limit ≤ 20, courseIds ≤ 20.
 */
export const fetchFeed = ({
  courseIds,
  cursor,
  limit = 10,
}: PageArgs & { courseIds: string[] }) =>
  api<FeedPage>("/feed" + qs({ courseIds, cursor, limit }));

/** GET /me/saved-videos — feed ile aynı öğe şekli, yayınlanma sırasıyla. */
export const fetchSavedVideos = ({ cursor, limit = 10 }: PageArgs) =>
  api<FeedPage>("/me/saved-videos" + qs({ cursor, limit }));
