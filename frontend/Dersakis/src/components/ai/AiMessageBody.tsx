import React from "react";
import { View } from "react-native";
import { C } from "@/theme";
import { T } from "@/components/ui/T";
import type { AiChatResponse } from "@/api/ai";
import { PlanCard } from "./PlanCard";
import { WrongAnswerCard } from "./WrongAnswerCard";
import { PracticeCard } from "./PracticeCard";

/**
 * Modelin yanıtı. Metin her zaman DÜZ METİN olarak çizilir (HTML/Markdown yorumlanmaz),
 * böylece modelden gelen içerik arayüzde kod gibi çalışamaz. Plan, yanlış ve alıştırma kartları
 * sunucunun doğrulanmış yapılandırılmış alanlarından çizilir.
 */
export function AiMessageBody({
  text,
  res,
  onAsk,
  busy,
}: {
  text: string;
  res?: AiChatResponse;
  onAsk?: (text: string) => void;
  busy?: boolean;
}) {
  return (
    <View style={{ gap: 10 }}>
      <T f="b" style={{ fontSize: 14.5, lineHeight: 21, color: C.ink }}>{text}</T>
      {res?.plan && <PlanCard plan={res.plan} />}
      {res?.wrongAnswers.map((w) => (
        <WrongAnswerCard key={w.questionId} item={w} disabled={busy} onSimilar={(t) => onAsk?.(t)} />
      ))}
      {res?.practice.map((p, i) => <PracticeCard key={i} item={p} />)}
    </View>
  );
}
