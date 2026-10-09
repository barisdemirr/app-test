/** Tüm react-query anahtarları tek yerde. Tercih değişince ['feed'], ['qa'], ['live'] geçersiz kılınır. */
export const queryKeys = {
  courses: ["courses"] as const,
  preferences: ["preferences"] as const,
  balance: ["balance"] as const,
  stats: ["stats"] as const,
  feed: (courseIds: string[]) => ["feed", courseIds] as const,
  qa: ["qa"] as const,
  qaConfig: ["qa", "config"] as const,
  qaList: (cats: string[], status: string, search: string, limit: number) =>
    ["qa", "list", cats, status, search, limit] as const,
  qaDetail: (id: string) => ["qa", "detail", id] as const,
  quiz: (videoId: string) => ["quiz", videoId] as const,
  savedVideos: ["saved-videos"] as const,
};
