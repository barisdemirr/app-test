import { initialQuestions } from "@/mocks";
import type { Question } from "@/types";
import { request } from "./client";

/**
 * Sorular listesi.
 * GET /questions
 */
export async function fetchQuestions(): Promise<Question[]> {
  return request<Question[]>("/questions", initialQuestions);
}

/**
 * Derslere göre filtreli sorular.
 * GET /questions?courses=...
 */
export async function fetchQuestionsForCourses(
  selectedCourses: string[],
): Promise<Question[]> {
  const all = await fetchQuestions();
  return all.filter((q) => selectedCourses.includes(q.course));
}

export type AskQuestionInput = {
  course: string;
  topic: string;
  text: string;
};

/**
 * Yeni soru sor.
 * POST /questions
 */
export async function askQuestion(
  input: AskQuestionInput,
): Promise<Question> {
  const q: Question = {
    id: `q${Date.now()}`,
    name: "Ada",
    initials: "AY",
    color: "#8B8CF8",
    course: input.course,
    topic: input.topic || "Genel",
    text: input.text,
    answers: [],
  };
  return request<Question>("/questions", q, { method: "POST" });
}

export type AnswerInput = {
  questionId: string;
  text: string;
};

/**
 * Bir soruya yanıt yaz.
 * POST /questions/:id/answers
 */
export async function answerQuestion(
  input: AnswerInput,
): Promise<{ ok: true }> {
  return request(
    `/questions/${input.questionId}/answers`,
    { ok: true },
    { method: "POST" },
  );
}