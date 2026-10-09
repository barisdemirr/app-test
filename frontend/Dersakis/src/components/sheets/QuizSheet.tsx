import React, { useMemo } from "react";
import { View } from "react-native";
import { X } from "lucide-react-native";
import { C, G_PRIMARY } from "@/theme";
import type { Quiz } from "@/types";
import { shuffle } from "@/utils";
import { GradBtn, Press, Sheet, T } from "@/components/ui";

export type QuizSheetProps = {
  quizList: Quiz[];
  quizStep: number;
  quizChoice: number | null;
  courseName: string;
  toast: string;
  onClose: () => void;
onPick: (i: number, options: { text: string; ok: boolean }[]) => void;
  onNext: () => void;
};

export function QuizSheet(p: QuizSheetProps) {
  const q = p.quizList[p.quizStep];

  // seçenekleri her adımda karıştır (hook'lar erken return'den önce çağrılmalı)
  const options = useMemo(() => {
    if (!q) return [];
    return shuffle([
      { text: q.correct, ok: true },
      ...q.wrong.map((w) => ({ text: w, ok: false })),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.quizStep, q]);

  if (!q) return null;

  return (
    <Sheet onClose={p.onClose} toast={p.toast}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <View style={{ flex: 1, paddingRight: 8 }}>
          <T f="bb" style={{ color: C.tide, fontSize: 11 }}>
            SORU {p.quizStep + 1}/{p.quizList.length} ·{" "}
            {p.courseName.toUpperCase()}
          </T>
          <T
            f="h"
            style={{
              fontSize: 21,
              lineHeight: 26,
              marginTop: 5,
              marginBottom: 15,
            }}
          >
            {q.q}
          </T>
        </View>
        <Press
          onPress={p.onClose}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#fff",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={18} color={C.muted} />
        </Press>
      </View>

      {options.map((o, i) => {
        const picked = p.quizChoice === i;
        const showOk = p.quizChoice !== null && o.ok;
        const bad = picked && !o.ok;
        return (
          <Press
            key={o.text}
            onPress={() => p.onPick(i, options)}
            style={{
              minHeight: 48,
              paddingHorizontal: 15,
              paddingVertical: 10,
              marginBottom: 9,
              borderRadius: 15,
              borderWidth: 1,
              flexDirection: "row",
              alignItems: "center",
              borderColor: showOk ? "#9CD8B5" : bad ? "#FFC3B6" : C.mist,
              backgroundColor: showOk ? "#E4F5EC" : bad ? "#FFF0ED" : "#fff",
            }}
          >
            <T f="bb" style={{ width: 24, color: C.muted }}>
              {String.fromCharCode(65 + i)}
            </T>
            <T
              f="bs"
              style={{
                flex: 1,
                color: showOk ? C.success : bad ? C.error : C.ink,
              }}
            >
              {o.text}
            </T>
          </Press>
        );
      })}

      {p.quizChoice !== null && (
        <View
          style={{
            borderRadius: 14,
            padding: 12,
            marginBottom: 12,
            backgroundColor: options[p.quizChoice].ok ? "#E7F6EE" : "#FFF2EF",
          }}
        >
          <T
            style={{
              fontSize: 12,
              lineHeight: 18,
              color: options[p.quizChoice].ok ? C.success : C.error,
            }}
          >
            <T
              f="bb"
              style={{
                fontSize: 12,
                color: options[p.quizChoice].ok ? C.success : C.error,
              }}
            >
              {options[p.quizChoice].ok ? "Doğru. " : "Yanlış. "}
            </T>
            {q.exp}
          </T>
        </View>
      )}

      <GradBtn
        label={p.quizStep === p.quizList.length - 1 ? "Bitir" : "Sonraki soru"}
        colors={G_PRIMARY}
        onPress={p.onNext}
      />
    </Sheet>
  );
}