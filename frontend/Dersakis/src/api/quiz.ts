/**
 * Quiz cevabı gönder.
 * POST /quiz/answer
 *
 * Backend cevap sonucunu ve verilen krediyi döner.
 */
import { request } from "./client";

export type QuizAnswerInput = {
  reelId: string;
  questionIndex: number;
  choiceIndex: number;
  correct: boolean;
};

export type QuizAnswerResult = {
  correct: boolean;
  creditsAwarded: number;
  explanation: string;
};

export async function submitQuizAnswer(
  input: QuizAnswerInput,
): Promise<QuizAnswerResult> {
  // Mock: doğruysa +5 kredi, yanlışsa 0
  const result: QuizAnswerResult = {
    correct: input.correct,
    creditsAwarded: input.correct ? 5 : 0,
    explanation: "",
  };
  return request<QuizAnswerResult>("/quiz/answer", result, { method: "POST" });
}