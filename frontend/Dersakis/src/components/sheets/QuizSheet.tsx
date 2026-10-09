import React, { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { X } from "lucide-react-native";
import { C, G_PRIMARY } from "@/theme";
import { errorMessage } from "@/api/errors";
import type { QuizQuestion, QuizResult } from "@/api/quiz";
import { useAnswerQuestion, useQuiz } from "@/queries";
import { GradBtn, Press, Sheet, T } from "@/components/ui";

export type QuizSheetProps = {
  videoId: string;
  courseName: string;
  toast: string;
  onClose: () => void;
  showToast: (m: string) => void;
};

export function QuizSheet(p: QuizSheetProps) {
  const quizQ = useQuiz(p.videoId);

  return (
    <Sheet onClose={p.onClose} toast={p.toast}>
      {quizQ.isLoading ? (
        <View style={{ padding: 40, alignItems: "center" }}>
          <ActivityIndicator color={C.tide} />
        </View>
      ) : quizQ.isError || !quizQ.data ? (
        <View style={{ gap: 14 }}>
          <T style={{ color: C.error }}>{errorMessage(quizQ.error)}</T>
          <GradBtn label="Kapat" colors={G_PRIMARY} onPress={p.onClose} />
        </View>
      ) : quizQ.data.questions.length === 0 ? (
        <View style={{ gap: 14 }}>
          <T>Bu videoda soru yok.</T>
          <GradBtn label="Kapat" colors={G_PRIMARY} onPress={p.onClose} />
        </View>
      ) : (
        <QuizBody
          questions={quizQ.data.questions}
          courseName={p.courseName}
          onClose={p.onClose}
          showToast={p.showToast}
        />
      )}
    </Sheet>
  );
}

function QuizBody({
  questions,
  courseName,
  onClose,
  showToast,
}: {
  questions: QuizQuestion[];
  courseName: string;
  onClose: () => void;
  showToast: (m: string) => void;
}) {
  const answer = useAnswerQuestion();
  const [local, setLocal] = useState<Record<string, QuizResult>>({});
  // Kaldığın yerden devam: ilk cevaplanmamış soru (hepsi cevaplıysa baştan, salt okunur)
  const [step, setStep] = useState(() => {
    const i = questions.findIndex((x) => !x.result);
    return i < 0 ? 0 : i;
  });

  const q = questions[step];
  const result: QuizResult | null = local[q.id] ?? q.result;
  const readOnly = !!q.result; // oturum açılırken zaten cevaplıydı
  const last = step === questions.length - 1;

  const pick = (optionId: string) => {
    if (result || answer.isPending) return; // yoldayken şıklar kilitli
    answer.mutate(
      { questionId: q.id, optionId },
      {
        onSuccess: (r) => {
          setLocal((m) => ({ ...m, [q.id]: r }));
          if (r.alreadyAnswered) showToast("Bu soruyu daha önce cevapladın");
          else if (r.creditAwarded > 0) showToast(`+${r.creditAwarded} kredi`);
          else if (r.isCorrect) showToast("Günlük kredi tavanına ulaştın");
          else showToast("Bu sefer kredi yok, açıklamaya bak");
        },
        onError: (e) => showToast(errorMessage(e)),
      },
    );
  };

  const next = () => {
    if (!result) return showToast("Önce bir seçenek işaretle");
    if (last) {
      onClose();
      showToast("Quiz tamamlandı");
    } else setStep(step + 1);
  };

  return (
    <>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <View style={{ flex: 1, paddingRight: 8 }}>
          <T f="bb" style={{ color: C.tide, fontSize: 11 }}>
            SORU {step + 1}/{questions.length} · {courseName.toUpperCase()}
          </T>
          <T f="h" style={{ fontSize: 21, lineHeight: 26, marginTop: 5, marginBottom: 15 }}>
            {q.text}
          </T>
        </View>
        <Press
          onPress={onClose}
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

      {readOnly && (
        <T style={{ color: C.muted, fontSize: 11, marginBottom: 10 }}>
          Daha önce cevapladın
        </T>
      )}

      {q.options.map((o, i) => {
        const picked = result?.selectedOptionId === o.id;
        const showOk = !!result && result.correctOptionId === o.id;
        const bad = picked && !!result && !result.isCorrect;
        return (
          <Press
            key={o.id}
            onPress={() => pick(o.id)}
            style={{
              minHeight: 48,
              paddingHorizontal: 15,
              paddingVertical: 10,
              marginBottom: 9,
              borderRadius: 15,
              borderWidth: 1,
              flexDirection: "row",
              alignItems: "center",
              opacity: answer.isPending && !picked ? 0.6 : 1,
              borderColor: showOk ? "#9CD8B5" : bad ? "#FFC3B6" : C.mist,
              backgroundColor: showOk ? "#E4F5EC" : bad ? "#FFF0ED" : "#fff",
            }}
          >
            <T f="bb" style={{ width: 24, color: C.muted }}>
              {String.fromCharCode(65 + i)}
            </T>
            <T f="bs" style={{ flex: 1, color: showOk ? C.success : bad ? C.error : C.ink }}>
              {o.text}
            </T>
          </Press>
        );
      })}

      {result && (
        <View
          style={{
            borderRadius: 14,
            padding: 12,
            marginBottom: 12,
            backgroundColor: result.isCorrect ? "#E7F6EE" : "#FFF2EF",
          }}
        >
          <T
            style={{
              fontSize: 12,
              lineHeight: 18,
              color: result.isCorrect ? C.success : C.error,
            }}
          >
            <T
              f="bb"
              style={{ fontSize: 12, color: result.isCorrect ? C.success : C.error }}
            >
              {result.isCorrect ? "Doğru. " : "Yanlış. "}
            </T>
            {result.explanation || "Üretici bu soru için açıklama eklemedi."}
          </T>
        </View>
      )}

      <GradBtn
        label={last ? "Bitir" : "Sonraki soru"}
        colors={G_PRIMARY}
        disabled={answer.isPending}
        onPress={next}
      />
    </>
  );
}
