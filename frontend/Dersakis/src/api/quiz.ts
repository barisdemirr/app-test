import { api } from "./http";

export type QuizResult = {
  selectedOptionId: string;
  correctOptionId: string;
  isCorrect: boolean;
  explanation: string | null;
  creditAwarded: number;
};

export type QuizQuestion = {
  id: string;
  position: number;
  text: string;
  /** Sunucu her istekte karıştırır; doğru şık işaretli gelmez. */
  options: { id: string; text: string }[];
  /** Daha önce cevaplandıysa dolu → salt okunur */
  result: QuizResult | null;
};

export type QuizResponse = { videoId: string; questions: QuizQuestion[] };

export type AnswerResponse = QuizResult & {
  questionId: string;
  balance: number;
  dailyCapReached: boolean;
  alreadyAnswered: boolean;
};

/** GET /videos/{id}/questions — izlenmiş olmalı (watch_required), kendi videon olamaz (own_video). */
export const fetchQuiz = (videoId: string) =>
  api<QuizResponse>(`/videos/${videoId}/questions`);

/** POST /questions/{id}/answer — her soru ömür boyu bir kez; Idempotency-Key gerekmez. */
export const answerQuestion = (questionId: string, optionId: string) =>
  api<AnswerResponse>(`/questions/${questionId}/answer`, {
    method: "POST",
    body: { optionId },
  });
