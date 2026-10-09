import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Star, X } from "lucide-react-native";
import { C, G_PRIMARY } from "@/theme";
import { errorMessage } from "@/api/errors";
import type { QaAnswer, QaDetail } from "@/api/qa";
import {
  useAnswerQa,
  useChooseBest,
  useEditAnswer,
  useQaQuestion,
} from "@/queries";
import { colorFor, initialsOf } from "@/utils/user";
import { formatCountdown, makeServerClock } from "@/utils/time";
import { Avatar, Chip, Field, GradBtn, Press, Sheet, T } from "@/components/ui";

export type QuestionSheetProps = {
  questionId: string;
  toast: string;
  onClose: () => void;
  showToast: (m: string) => void;
};

/** Sunucu saatine göre kalan süre (ms); telefon saati yanlış olabilir. */
function useRemaining(deadlineUtc: string | null, clock: ReturnType<typeof makeServerClock>) {
  const [, tick] = useState(0);
  useEffect(() => {
    if (!deadlineUtc) return;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [deadlineUtc]);
  return deadlineUtc ? Math.max(0, clock.remainingMs(deadlineUtc)) : 0;
}

export function QuestionSheet(p: QuestionSheetProps) {
  const q = useQaQuestion(p.questionId);

  return (
    <Sheet onClose={p.onClose} toast={p.toast}>
      {q.isLoading ? (
        <View style={{ padding: 40, alignItems: "center" }}>
          <ActivityIndicator color={C.tide} />
        </View>
      ) : q.isError || !q.data ? (
        <View style={{ gap: 14 }}>
          <T style={{ color: C.error }}>{errorMessage(q.error)}</T>
          <GradBtn label="Kapat" colors={G_PRIMARY} onPress={p.onClose} />
        </View>
      ) : (
        <Detail
          data={q.data}
          updatedAt={q.dataUpdatedAt}
          questionId={p.questionId}
          onClose={p.onClose}
          showToast={p.showToast}
        />
      )}
    </Sheet>
  );
}

function Detail({
  data,
  updatedAt,
  questionId,
  onClose,
  showToast,
}: {
  data: QaDetail;
  updatedAt: number;
  questionId: string;
  onClose: () => void;
  showToast: (m: string) => void;
}) {
  const { question: sq, answers } = data;
  const clock = useMemo(() => makeServerClock(data.serverNowUtc), [data.serverNowUtc, updatedAt]);
  const answer = useAnswerQa(questionId);
  const best = useChooseBest(questionId);
  const [text, setText] = useState("");

  const mine = answers.find((a) => a.isMine);
  const selectionOpen =
    !sq.selectionDeadlineUtc || clock.remainingMs(sq.selectionDeadlineUtc) > 0;
  const canPick = sq.isMine && !sq.hasBestAnswer && selectionOpen;
  const canAnswer = !sq.isMine && !sq.hasBestAnswer && !mine && !sq.refunded;

  const send = () => {
    const t = text.trim();
    if (t.length < 2) return showToast("Yanıtın en az 2 karakter olmalı");
    answer.mutate(t, {
      onSuccess: () => {
        setText("");
        showToast("Yanıtın eklendi");
      },
      onError: (e) => showToast(errorMessage(e)),
    });
  };

  const pick = (a: QaAnswer) =>
    best.mutate(a.id, {
      onSuccess: () => showToast("En iyi cevap seçildi"),
      onError: (e) => showToast(errorMessage(e)),
    });

  return (
    <>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <T f="bb" style={{ color: C.tide, fontSize: 11, flex: 1 }}>
          {sq.category}
          {sq.topic ? ` · ${sq.topic}` : ""}
        </T>
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
      <T f="h" style={{ fontSize: 21, lineHeight: 25, marginTop: 9, marginBottom: 6 }}>
        {sq.text}
      </T>
      <T style={{ color: C.muted, fontSize: 11, marginBottom: 14 }}>
        {sq.authorName}
        {sq.hasBestAnswer ? " · Çözüldü" : ` · en iyi cevaba ${sq.reward} kredi`}
      </T>

      <T f="bb" style={{ fontSize: 12, marginBottom: 9 }}>
        Yanıtlar · {sq.answerCount}
      </T>
      {answers.length === 0 && (
        <T style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>
          {sq.isMine ? "Henüz cevap yok." : "Henüz cevap yok. İlk cevabı sen ver."}
        </T>
      )}
      {answers.map((a) => (
        <AnswerRow
          key={a.id}
          a={a}
          clock={clock}
          questionId={questionId}
          canPick={canPick}
          picking={best.isPending}
          onPick={() => pick(a)}
          showToast={showToast}
        />
      ))}

      <View style={{ height: 6 }} />
      {canAnswer ? (
        <>
          <Field
            label="Yanıtını yaz"
            value={text}
            onChange={setText}
            placeholder="Yardımcı olabileceğin bir şey var mı?"
            multiline
            maxLength={1000}
          />
          <GradBtn
            label={answer.isPending ? "Gönderiliyor…" : "Yanıtla"}
            colors={G_PRIMARY}
            disabled={answer.isPending}
            onPress={send}
          />
        </>
      ) : (
        <T style={{ color: C.muted, fontSize: 12 }}>
          {sq.hasBestAnswer || sq.refunded
            ? "Bu soru kapandı."
            : sq.isMine
              ? "Kendi sorunu cevaplayamazsın."
              : mine
                ? "Bu soruya zaten cevap verdin."
                : ""}
        </T>
      )}
    </>
  );
}

function AnswerRow({
  a,
  clock,
  questionId,
  canPick,
  picking,
  onPick,
  showToast,
}: {
  a: QaAnswer;
  clock: ReturnType<typeof makeServerClock>;
  questionId: string;
  canPick: boolean;
  picking: boolean;
  onPick: () => void;
  showToast: (m: string) => void;
}) {
  const edit = useEditAnswer(questionId);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(a.text);
  const left = useRemaining(a.editableUntilUtc, clock);
  const editable = a.isMine && !a.isBest && !!a.editableUntilUtc && left > 0;

  useEffect(() => {
    if (editing && !editable) setEditing(false);
  }, [editing, editable]);

  const save = () => {
    const t = draft.trim();
    if (t.length < 2) return showToast("Yanıtın en az 2 karakter olmalı");
    edit.mutate(
      { answerId: a.id, text: t },
      {
        onSuccess: () => {
          setEditing(false);
          showToast("Yanıtın güncellendi");
        },
        onError: (e) => showToast(errorMessage(e)),
      },
    );
  };

  return (
    <View
      style={{
        padding: 13,
        borderRadius: 15,
        backgroundColor: a.isBest ? "#FFF8E1" : "#fff",
        borderWidth: a.isBest ? 1 : 0,
        borderColor: "#FFD66B",
        marginBottom: 8,
        flexDirection: "row",
        gap: 9,
      }}
    >
      <Avatar initials={initialsOf(a.authorName)} color={colorFor(a.authorId)} size={29} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <T f="bb" style={{ fontSize: 11 }}>
            {a.isMine ? "Sen" : a.authorName}
          </T>
          {a.isBest && <Star size={12} color="#E0A100" fill="#FFD66B" />}
          {a.isBest && (
            <T f="bb" style={{ fontSize: 10, color: "#B07F00" }}>
              En iyi cevap
            </T>
          )}
          {a.editedAtUtc && <T style={{ fontSize: 9, color: C.muted }}>düzenlendi</T>}
        </View>
        {editing ? (
          <>
            <Field value={draft} onChange={setDraft} multiline maxLength={1000} />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <GradBtn
                label={edit.isPending ? "Kaydediliyor…" : "Kaydet"}
                small
                colors={G_PRIMARY}
                disabled={edit.isPending}
                onPress={save}
              />
              <Chip onPress={() => setEditing(false)}>Vazgeç</Chip>
            </View>
          </>
        ) : (
          <T style={{ fontSize: 12, lineHeight: 18 }}>{a.text}</T>
        )}
        {!editing && (editable || canPick) && (
          <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
            {editable && (
              <Chip
                onPress={() => {
                  setDraft(a.text);
                  setEditing(true);
                }}
              >
                {`Düzenle · ${formatCountdown(left)}`}
              </Chip>
            )}
            {canPick && !a.isMine && (
              <Chip onPress={picking ? undefined : onPick}>En iyi cevap seç</Chip>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
