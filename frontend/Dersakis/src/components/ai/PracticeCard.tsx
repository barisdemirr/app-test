import React, { useState } from "react";
import { View } from "react-native";
import { C } from "@/theme";
import { T } from "@/components/ui/T";
import { Press } from "@/components/ui/Press";
import type { AiPractice } from "@/api/ai";

const LETTERS = ["A", "B", "C", "D", "E"];

/**
 * Yapay zekâ üretimi alıştırma sorusu. Şıkka dokununca doğru/yanlış ve açıklama açılır.
 * Bu sorular puan/kredi etkilemez; yalnızca kendini denemek içindir.
 */
export function PracticeCard({ item }: { item: AiPractice }) {
  const [picked, setPicked] = useState<number | null>(null);
  const done = picked !== null;
  const right = picked === item.correctIndex;

  return (
    <View style={{ borderRadius: 16, backgroundColor: C.pearl, borderWidth: 1, borderColor: C.mist, padding: 12, gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View style={{ paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10, backgroundColor: "#FFF1D6" }}>
          <T f="bm" style={{ fontSize: 11.5, color: "#9A6A00" }}>✨ Alıştırma · {item.course}</T>
        </View>
      </View>
      <T f="hm" style={{ fontSize: 14, lineHeight: 20 }}>{item.question}</T>
      <View style={{ gap: 6 }}>
        {item.options.map((o, i) => {
          const isRight = i === item.correctIndex;
          const isPicked = i === picked;
          const bg = !done ? C.foam : isRight ? "#E4F6EC" : isPicked ? "#FDECEA" : C.foam;
          const bd = !done ? C.mist : isRight ? C.success : isPicked ? C.error : C.mist;
          return (
            <Press
              key={i}
              disabled={done}
              scaleTo={0.98}
              onPress={() => setPicked(i)}
              style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: bg, borderWidth: 1.5, borderColor: bd, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 9 }}
            >
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: C.pearl, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: bd }}>
                <T f="h" style={{ fontSize: 12, color: C.deep }}>{LETTERS[i] ?? i + 1}</T>
              </View>
              <T f="b" style={{ flex: 1, fontSize: 13.5, lineHeight: 19 }}>{o}</T>
              {done && (isRight || isPicked) && (
                <T f="h" style={{ fontSize: 14, color: isRight ? C.success : C.error }}>{isRight ? "✓" : "✕"}</T>
              )}
            </Press>
          );
        })}
      </View>
      {done && (
        <View style={{ backgroundColor: right ? "#E4F6EC" : "#FFF4E5", borderRadius: 10, padding: 10, gap: 3 }}>
          <T f="h" style={{ fontSize: 13, color: right ? C.success : "#9A6A00" }}>
            {right ? "Harika, doğru! 🎉" : "Olmadı, birlikte bakalım"}
          </T>
          {!!item.explanation && <T f="b" style={{ fontSize: 13, lineHeight: 18, color: C.ink }}>{item.explanation}</T>}
        </View>
      )}
    </View>
  );
}
