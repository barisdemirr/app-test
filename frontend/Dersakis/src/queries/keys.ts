/** Tüm react-query anahtarları tek yerde. Tercih değişince ['feed'], ['qa'], ['live'] geçersiz kılınır. */
export const queryKeys = {
  courses: ["courses"] as const,
  preferences: ["preferences"] as const,
  balance: ["balance"] as const,
  stats: ["stats"] as const,
  feed: (courseIds: string[]) => ["feed", courseIds] as const,
  quiz: (videoId: string) => ["quiz", videoId] as const,
  savedVideos: ["saved-videos"] as const,
};
