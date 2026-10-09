import React from "react";
import { View } from "react-native";
import { X } from "lucide-react-native";
import { C, G_PRIMARY } from "@/theme";
import type { Question } from "@/types";
import { Avatar, Field, GradBtn, Press, Sheet, T } from "@/components/ui";

export type QuestionSheetProps = {
  question: Question;
  toast: string;
  answerText: string;
  onClose: () => void;
  onAnswerChange: (v: string) => void;
  onSubmit: () => void;
};

export function QuestionSheet(p: QuestionSheetProps) {
  const sq = p.question;
  return (
    <Sheet onClose={p.onClose} toast={p.toast}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <T f="bb" style={{ color: C.tide, fontSize: 11 }}>
          {sq.course} · {sq.topic}
        </T>
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
      <T
        f="h"
        style={{ fontSize: 21, lineHeight: 25, marginTop: 9, marginBottom: 14 }}
      >
        {sq.text}
      </T>
      <T f="bb" style={{ fontSize: 12, marginBottom: 9 }}>
        Yanıtlar · {sq.answers.length}
      </T>
      {sq.answers.length === 0 && (
        <T style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>
          Henüz cevap yok. İlk cevabı sen ver.
        </T>
      )}
      {sq.answers.map((a, i) => (
        <View
          key={i}
          style={{
            padding: 13,
            borderRadius: 15,
            backgroundColor: "#fff",
            marginBottom: 8,
            flexDirection: "row",
            gap: 9,
          }}
        >
          <Avatar
            initials={i % 2 ? "MA" : "EY"}
            color={i % 2 ? "#F29C72" : "#8589F9"}
            size={29}
          />
          <T style={{ flex: 1, fontSize: 12, lineHeight: 18 }}>{a}</T>
        </View>
      ))}
      <View style={{ height: 6 }} />
      <Field
        label="Yanıtını yaz"
        value={p.answerText}
        onChange={p.onAnswerChange}
        placeholder="Yardımcı olabileceğin bir şey var mı?"
        multiline
      />
      <GradBtn label="Yanıtla" colors={G_PRIMARY} onPress={p.onSubmit} />
    </Sheet>
  );
}