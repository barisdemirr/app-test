import type { AiChatResponse } from "@/api/ai";

export type AiMessage = {
  id: string;
  role: "user" | "model";
  text: string;
  /** Modelin yapılandırılmış yanıtı (plan, yanlışlar, alıştırmalar) */
  res?: AiChatResponse;
  error?: boolean;
};

/** Sohbet boşken ve her zaman en üstte duran hazır mesajlar */
export const AI_QUICK_PROMPTS = [
  "Çalışma planı oluştur",
  "Yanlış yaptığım soruları göster",
  "Yanlışlarıma benzer soru ver",
  "En zayıf konularım neler?",
];
