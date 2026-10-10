import React, { useState } from "react";
import { View } from "react-native";
import { Send } from "lucide-react-native";
import { C, G_PRIMARY } from "@/theme";
import { errorMessage } from "@/api/errors";
import { useAskQuestion, useCourseNames, useQaConfig } from "@/queries";
import { qaCategoriesFor, qaCategoryOfCourse } from "@/utils/qa";
import { Chip, Field, GradBtn, Sheet, T } from "@/components/ui";

export type AskSheetProps = {
  toast: string;
  credits: number;
  /** Varsayılan kategori (seçili derslerden ilki) */
  defaultCategory: string;
  /** Kullanıcının seçili dersleri: yalnızca bunlarla eşleşen kategoriler (+ Diğer) sunulur, soru listede görünür */
  selectedCourses: string[];
  onClose: () => void;
  /** Soru sorulan ders seçili değilse seçime eklemek için */
  onAsked: (category: string) => void;
  showToast: (m: string) => void;
};

export function AskSheet(p: AskSheetProps) {
  const config = useQaConfig();
  const courseNames = useCourseNames();
  const ask = useAskQuestion();

  const all = config.data?.categories?.length ? config.data.categories : courseNames;
  const categories = qaCategoriesFor(p.selectedCourses, all);
  const [picked, setPicked] = useState(
    qaCategoryOfCourse(p.defaultCategory, all) ?? "",
  );
  const category = categories.includes(picked) ? picked : (categories[0] ?? "");
  const [topic, setTopic] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const cost = config.data?.textQuestionCost;
  const short = cost != null && p.credits < cost;

  const submit = () => {
    const t = text.trim();
    if (t.length < 5) return setError("Sorun en az 5 karakter olmalı.");
    if (short) return setError("Soru sormak için yeterli kredin yok.");
    setError("");
    ask.mutate(
      { category, topic: topic.trim(), text: t },
      {
        onSuccess: () => {
          p.onAsked(category);
          p.onClose();
          p.showToast("Sorun paylaşıldı");
        },
        onError: (e) => setError(errorMessage(e)),
      },
    );
  };

  return (
    <Sheet onClose={p.onClose} toast={p.toast}>
      <T f="h" style={{ fontSize: 21, marginTop: 3, marginBottom: 15 }}>
        Bilene sor
      </T>
      <T f="bb" style={{ fontSize: 12, color: C.muted, marginBottom: 7 }}>
        Ders
      </T>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
        {categories.map((c) => (
          <Chip key={c} active={category === c} onPress={() => setPicked(c)}>
            {c}
          </Chip>
        ))}
      </View>
      <Field
        label="Konu (isteğe bağlı)"
        value={topic}
        onChange={setTopic}
        placeholder="Örn. Limit"
        maxLength={40}
      />
      <Field
        label="Sorun"
        value={text}
        onChange={setText}
        placeholder="Aklındaki soruyu yaz..."
        multiline
        maxLength={500}
      />
      {cost != null && (
        <T style={{ color: short ? C.error : C.muted, fontSize: 12, marginBottom: 12 }}>
          {cost} kredi düşecek · bakiyen {p.credits}
        </T>
      )}
      {error ? (
        <T f="bs" style={{ color: C.error, fontSize: 12, marginBottom: 10 }}>
          {error}
        </T>
      ) : null}
      <GradBtn
        label={ask.isPending ? "Gönderiliyor…" : "Soruyu paylaş"}
        colors={G_PRIMARY}
        disabled={ask.isPending || !config.data}
        icon={<Send size={14} color="#fff" />}
        onPress={submit}
      />
    </Sheet>
  );
}
