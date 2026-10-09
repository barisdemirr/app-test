import React, { useState } from "react";
import { View } from "react-native";
import { C, G_PRIMARY } from "@/theme";
import { errorMessage } from "@/api/errors";
import { useCourses, useCreateVoice } from "@/queries";
import { Chip, Field, GradBtn, Sheet, T } from "@/components/ui";

/** Sesli soru ilanı: kredi ilan açılırken hemen düşer, kimse katılmazsa iade edilir. */
export function CreateVoiceSheet({
  toast,
  credits,
  defaultCourseId,
  onClose,
  onCreated,
}: {
  toast: string;
  credits: number;
  defaultCourseId: string;
  onClose: () => void;
  onCreated: (sessionId: string) => void;
}) {
  const courses = useCourses().data ?? [];
  const create = useCreateVoice();
  const [courseId, setCourseId] = useState(defaultCourseId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  // İlan ücreti sunucu ayarıdır (Live:VoiceCost) ve ilan açılmadan önce öğrenilebilecek bir
  // uç yok; tutarı uydurmayız. Yetmezse sunucu `insufficient_credits` döner, mesajı gösteririz.
  const empty = credits <= 0;
  const picked = courses.find((c) => c.id === courseId)?.id ?? courses[0]?.id ?? "";

  const submit = () => {
    const t = title.trim();
    const d = description.trim();
    if (t.length < 3 || t.length > 80) return setError("Başlık 3-80 karakter olmalı.");
    if (d.length < 5 || d.length > 500) return setError("Açıklama 5-500 karakter olmalı.");
    if (!picked) return setError("Bir ders seç.");
    if (empty) return setError("Sesli soru sormak için krediye ihtiyacın var. Önce video izleyip quiz çöz.");
    setError("");
    create.mutate(
      { courseId: picked, title: t, description: d },
      {
        onSuccess: (r) => {
          onClose();
          onCreated(r.session.id);
        },
        onError: (e) => setError(errorMessage(e)),
      },
    );
  };

  return (
    <Sheet onClose={onClose} toast={toast}>
      <T f="h" style={{ fontSize: 21, marginTop: 3, marginBottom: 6 }}>
        Sesli soru sor
      </T>
      <T style={{ color: C.muted, fontSize: 12, lineHeight: 17, marginBottom: 14 }}>
        Birisi ilanına katılınca seninle sesli konuşur. Kimse katılmazsa kredin iade edilir.
      </T>
      <T f="bb" style={{ fontSize: 12, color: C.muted, marginBottom: 7 }}>
        Ders
      </T>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
        {courses.map((c) => (
          <Chip key={c.id} active={picked === c.id} onPress={() => setCourseId(c.id)}>
            {c.name}
          </Chip>
        ))}
      </View>
      <Field label="Başlık" value={title} onChange={setTitle} placeholder="Örn. Türev nedir?" maxLength={80} />
      <Field
        label="Açıklama"
        value={description}
        onChange={setDescription}
        placeholder="Neyi anlamadığını yaz"
        multiline
        maxLength={500}
      />
      <T style={{ color: empty ? C.error : C.muted, fontSize: 12, marginBottom: 12 }}>
        İlan açılınca kredin hemen ayrılır; kimse katılmazsa ya da iptal edersen iade edilir. Bakiyen:{" "}
        {credits}
      </T>
      {error ? (
        <T f="bs" style={{ color: C.error, fontSize: 12, marginBottom: 10 }}>
          {error}
        </T>
      ) : null}
      <GradBtn
        label={create.isPending ? "Açılıyor…" : "İlanı aç"}
        colors={G_PRIMARY}
        disabled={create.isPending}
        onPress={submit}
      />
    </Sheet>
  );
}
