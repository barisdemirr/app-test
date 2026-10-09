import React from "react";
import { View } from "react-native";
import { Send } from "lucide-react-native";
import { C, G_PRIMARY } from "@/theme";
import { useCourseNames } from "@/queries";
import { Chip, Field, GradBtn, Sheet, T } from "@/components/ui";

export type AskSheetProps = {
  toast: string;
  askCourse: string;
  askTopic: string;
  askText: string;
  onClose: () => void;
  onCourseChange: (c: string) => void;
  onTopicChange: (v: string) => void;
  onTextChange: (v: string) => void;
  onSubmit: () => void;
};

export function AskSheet(p: AskSheetProps) {
  const courses = useCourseNames();
  return (
    <Sheet onClose={p.onClose} toast={p.toast}>
      <T f="h" style={{ fontSize: 21, marginTop: 3, marginBottom: 15 }}>
        Bilene sor
      </T>
      <T f="bb" style={{ fontSize: 12, color: C.muted, marginBottom: 7 }}>
        Ders
      </T>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 7,
          marginBottom: 14,
        }}
      >
        {courses.map((c) => (
          <Chip
            key={c}
            active={p.askCourse === c}
            onPress={() => p.onCourseChange(c)}
          >
            {c}
          </Chip>
        ))}
      </View>
      <Field
        label="Konu"
        value={p.askTopic}
        onChange={p.onTopicChange}
        placeholder="Örn. Limit"
        maxLength={40}
      />
      <Field
        label="Sorun"
        value={p.askText}
        onChange={p.onTextChange}
        placeholder="Aklındaki soruyu yaz..."
        multiline
        maxLength={240}
      />
      <GradBtn
        label="Soruyu paylaş"
        colors={G_PRIMARY}
        icon={<Send size={14} color="#fff" />}
        onPress={p.onSubmit}
      />
    </Sheet>
  );
}