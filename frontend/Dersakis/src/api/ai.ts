import { api } from "./http";

export type AiRole = "user" | "model";

export type AiPlanTask = { topic: string; minutes: number; what: string };
export type AiPlanDay = { day: string; tasks: AiPlanTask[] };
export type AiPlan = { title: string; days: AiPlanDay[] };

export type AiWrongAnswer = {
  questionId: string;
  course: string;
  topic: string;
  videoTitle: string;
  question: string;
  yourAnswer: string;
  correctAnswer: string;
  explanation: string;
  answeredAtUtc: string;
};

export type AiPractice = {
  course: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type AiChatResponse = {
  reply: string;
  plan: AiPlan | null;
  practice: AiPractice[];
  wrongAnswers: AiWrongAnswer[];
  suggestions: string[];
  remainingToday: number;
};

export type AiTurn = { role: AiRole; text: string };

/** Yapay zekâ yanıtı yavaş olabilir: istemci zaman aşımı sunucununkinden (25 sn) biraz uzun. */
const AI_TIMEOUT_MS = 40_000;

/**
 * POST /ai/chat — Dolphy çalışma koçu.
 * Kullanıcı bağlamı (yanlışlar, istatistikler) sunucuda JWT'den çekilir; istemci yalnızca konuşma geçmişini yollar.
 */
export function sendAiChat(messages: AiTurn[], signal?: AbortSignal): Promise<AiChatResponse> {
  return api<AiChatResponse>("/ai/chat", {
    method: "POST",
    body: { messages },
    timeoutMs: AI_TIMEOUT_MS,
    signal,
  });
}
