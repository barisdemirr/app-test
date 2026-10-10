import React from "react";
import { View } from "react-native";
import { C } from "@/theme";
import { T } from "@/components/ui/T";
import { Press } from "@/components/ui/Press";
import type { AiWrongAnswer } from "@/api/ai";

/** Kullanıcının yanlış cevapladığı bir soru: verdiği cevap, doğrusu, açıklama ve "benzerini ver" kısayolu. */
export function WrongAnswerCard({
  item,
  onSimilar,
  disabled,
}: {
  item: AiWrongAnswer;
  onSimilar: (text: string) => void;
  disabled?: boolean;
}) {
  return (
    <View style={{ borderRadius: 16, backgroundColor: C.pearl, borderWidth: 1, borderColor: C.mist, padding: 12, gap: 8 }}>
      <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
        <View style={{ paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10, backgroundColor: "#E6F0FF" }}>
          <T f="bm" style={{ fontSize: 11.5, color: C.tide }}>{item.course}</T>
        </View>
        {!!item.topic && (
          <View style={{ paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10, backgroundColor: "#E3F7FA" }}>
            <T f="bm" style={{ fontSize: 11.5, color: "#0E8794" }}>{item.topic}</T>
          </View>
        )}
      </View>
      <T f="hm" style={{ fontSize: 14, lineHeight: 20 }}>{item.question}</T>
      <View style={{ gap: 5 }}>
        <View style={{ flexDirection: "row", gap: 8, backgroundColor: "#FDECEA", borderRadius: 10, padding: 8 }}>
          <T f="h" style={{ color: C.error, fontSize: 13 }}>✕</T>
          <T f="b" style={{ flex: 1, fontSize: 13, color: C.error }}>Senin cevabın: {item.yourAnswer}</T>
        </View>
        <View style={{ flexDirection: "row", gap: 8, backgroundColor: "#E4F6EC", borderRadius: 10, padding: 8 }}>
          <T f="h" style={{ color: C.success, fontSize: 13 }}>✓</T>
          <T f="b" style={{ flex: 1, fontSize: 13, color: C.success }}>Doğrusu: {item.correctAnswer}</T>
        </View>
      </View>
      {!!item.explanation && (
        <T f="b" style={{ fontSize: 13, color: C.muted, lineHeight: 18 }}>💡 {item.explanation}</T>
      )}
      <Press
        disabled={disabled}
        onPress={() => onSimilar(`"${item.topic || item.course}" konusunda bu yanlışıma benzer bir soru ver`.slice(0, 200))}
        style={{ alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, borderWidth: 1.5, borderColor: C.tide, opacity: disabled ? 0.5 : 1 }}
      >
        <T f="bm" style={{ color: C.tide, fontSize: 12.5 }}>Benzerini çöz →</T>
      </Press>
    </View>
  );
}
