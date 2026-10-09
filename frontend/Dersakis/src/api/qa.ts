import { api, qs } from "./http";
import type { CursorPage } from "./types";

export type QaConfig = {
  categories: string[];
  textQuestionCost: number;
  voiceQuestionCost: number;
  textBestReward: number;
  voiceBestReward: number;
  /** Yazılı sistemde sesli mod KAPALI; sesli sor /live/voice akışıdır */
  voiceEnabled: boolean;
  bestAnswerWindowDays: number;
  editWindowSeconds: number;
};

export type QaQuestion = {
  id: string;
  category: string;
  topic: string;
  text: string;
  mode: "Text" | "Voice";
  cost: number;
  reward: number;
  authorId: string;
  authorName: string;
  isMine: boolean;
  answerCount: number;
  hasBestAnswer: boolean;
  bestAnswerId: string | null;
  /** İlk cevaptan sonra dolar; bu zamandan sonra soran seçemez, ödül otomatik gider */
  selectionDeadlineUtc: string | null;
  createdAtUtc: string;
  refunded: boolean;
};

export type QaAnswer = {
  id: string;
  authorId: string;
  authorName: string;
  isMine: boolean;
  text: string;
  isBest: boolean;
  /** Yalnızca kendi cevabında ve düzenlenebilirken dolu */
  editableUntilUtc: string | null;
  editedAtUtc: string | null;
  createdAtUtc: string;
};

export type QaDetail = {
  question: QaQuestion;
  answers: QaAnswer[];
  serverNowUtc: string;
};

export type QaStatus = "all" | "open" | "solved";

export type QaListArgs = {
  categories: string[];
  status?: QaStatus;
  search?: string;
  cursor?: number | string;
  limit?: number;
};

export const fetchQaConfig = () => api<QaConfig>("/qa/config");

/** limit ≤ 30, search ≤ 50. Yazılı sistem: mode=Text. Arama sunucuda yapılır. */
export const fetchQaQuestions = (a: QaListArgs) =>
  api<CursorPage<QaQuestion>>(
    "/qa/questions" +
      qs({
        categories: a.categories,
        mode: "Text",
        status: a.status ?? "all",
        search: a.search?.slice(0, 50),
        cursor: a.cursor,
        limit: a.limit ?? 10,
      }),
  );

export const fetchQaQuestion = (id: string) => api<QaDetail>(`/qa/questions/${id}`);

/** POST /qa/questions (idem) — kredi düşer, `balance` ile başlık güncellenir. */
export const createQaQuestion = (
  body: { category: string; topic: string; text: string },
  idemKey: string,
) =>
  api<{ question: QaQuestion; balance: number }>("/qa/questions", {
    method: "POST",
    body: { ...body, mode: "Text" },
    idemKey,
  });

/** POST /qa/questions/{id}/answers (idem) — 2-1000 karakter. */
export const createQaAnswer = (questionId: string, text: string, idemKey: string) =>
  api<{ answer: QaAnswer; answerCount: number }>(`/qa/questions/${questionId}/answers`, {
    method: "POST",
    body: { text },
    idemKey,
  });

/** PUT /qa/answers/{id} — yazdıktan sonra editWindowSeconds içinde; idem gerekmez. */
export const editQaAnswer = (answerId: string, text: string) =>
  api<QaAnswer>(`/qa/answers/${answerId}`, { method: "PUT", body: { text } });

/** POST /qa/questions/{id}/best-answer — yalnızca soran; aynı cevabı tekrar seçmek zararsız. */
export const chooseBestAnswer = (questionId: string, answerId: string) =>
  api<{
    questionId: string;
    bestAnswerId: string;
    reward: number;
    chosenBy: "Asker" | "Auto";
    alreadyChosen: boolean;
  }>(`/qa/questions/${questionId}/best-answer`, { method: "POST", body: { answerId } });
