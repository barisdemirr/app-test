import type { UserProfile } from "@/types";

export const mockUser: UserProfile = {
  id: "u1",
  name: "Ada Yılmaz",
  handle: "adayilmaz",
  initials: "AY",
  color: "#7276F4",
  bio: "Merhaba! Matematik 1 ve Fizik 1 çalışıyorum.",
  credits: 40,
  earnedToday: 0,
  dailyCap: 60,
  streak: 12,
  stats: { total: 25, correct: 18 },
};