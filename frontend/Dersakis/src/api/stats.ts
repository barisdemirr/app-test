import { api } from "./http";

export type TopicStat = { topic: string; answered: number; correct: number; percent: number };
export type CourseStat = {
  courseId: string;
  courseName: string;
  answered: number;
  correct: number;
  percent: number;
  topics: TopicStat[];
};
export type StatsDto = {
  answered: number;
  correct: number;
  percent: number;
  courses: CourseStat[];
};

/** GET /me/stats */
export const fetchStats = () => api<StatsDto>("/me/stats");
