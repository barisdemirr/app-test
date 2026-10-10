import React from "react";
import { View } from "react-native";
import { C } from "@/theme";
import { T } from "@/components/ui/T";
import type { AiChatResponse } from "@/api/ai";

/**
 * Modelin yanıtı. Metin her zaman DÜZ METİN olarak çizilir (HTML/Markdown yorumlanmaz),
 * böylece modelden gelen içerik arayüzde kod gibi çalışamaz.
 * Plan / yanlış / alıştırma kartları sonraki aşamada eklenir; şimdilik sade metin özeti gösterilir.
 */
export function AiMessageBody({ text, res }: { text: string; res?: AiChatResponse }) {
  return (
    <View style={{ gap: 8 }}>
      <T f="b" style={{ fontSize: 14.5, lineHeight: 21, color: C.ink }}>
        {text}
      </T>
      {res?.plan && (
        <T f="bm" style={{ fontSize: 13, color: C.muted }}>
          {res.plan.title}: {res.plan.days.length} günlük plan hazır.
        </T>
      )}
      {!!res?.wrongAnswers.length && (
        <T f="bm" style={{ fontSize: 13, color: C.muted }}>
          {res.wrongAnswers.length} yanlış soru bulundu.
        </T>
      )}
      {!!res?.practice.length && (
        <T f="bm" style={{ fontSize: 13, color: C.muted }}>
          {res.practice.length} alıştırma sorusu hazır.
        </T>
      )}
    </View>
  );
}
