export type Lesson = {
  title: string;
  desc: string;
  course: string;
  teacher: string;
  role: string;
  initials: string;
  color: string;
  time: string;
};

export type Question = {
  id?: string;
  name: string;
  initials: string;
  color: string;
  course: string;
  topic: string;
  text: string;
  answers: string[];
};

export type Quiz = {
  q: string;
  correct: string;
  wrong: string[];
  exp: string;
};

export type Reel = {
  id: string;
  course: string;
  creator: string;
  initials: string;
  color: string;
  title: string;
  lines: string[];
  result: string;
  quiz: Quiz[];
};

export type RewardIcon =
  | "book"
  | "mentor"
  | "spark"
  | "exam"
  | "cards"
  | "coffee"
  | "crown";

export type Reward = {
  id: string;
  name: string;
  source: string;
  price: number;
  icon: RewardIcon;
  featured?: boolean;
};

export type UserStats = { total: number; correct: number };

export type UserProfile = {
  id: string;
  name: string;
  handle: string;
  initials: string;
  color: string;
  bio: string;
  credits: number;
  earnedToday: number;
  dailyCap: number;
  streak: number;
  stats: UserStats;
};