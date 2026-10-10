import React, { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { C, G_PRIMARY } from "@/theme";
import { errorMessage } from "@/api/errors";
import { useCourses, useCreateLesson } from "@/queries";
import { Chip, Field, GradBtn, Sheet, T } from "@/components/ui";

const DURATIONS = [5, 10, 15, 30, 45, 60, 90];
/** Hızlı başlangıç: "N dk sonra". null = özel gün/saat seç. */
const QUICK: { label: string; min: number | null }[] = [
  { label: "5 dk sonra", min: 5 },
  { label: "15 dk sonra", min: 15 },
  { label: "30 dk sonra", min: 30 },
  { label: "1 saat sonra", min: 60 },
  { label: "Özel zaman", min: null },
];
const SLOTS = Array.from({ length: 32 }, (_, i) => 8 * 60 + i * 30); // 08:00 – 23:30
const DAY_FMT: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" };

const pad = (n: number) => String(n).padStart(2, "0");
const slotLabel = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

/**
 * Eğitim ilanı. Sınırlar sunucu ayarıdır (en kısa süre, en erken başlangıç, fiyat aralığı) ve
 * ortama göre değişir; bu yüzden burada sert kural koymayız, sunucunun mesajını gösteririz.
 */
export function CreateLessonSheet({
  toast,
  defaultCourseId,
  onClose,
  onCreated,
}: {
  toast: string;
  defaultCourseId: string;
  onClose: () => void;
  onCreated: (sessionId: string) => void;
}) {
  const courses = useCourses().data ?? [];
  const create = useCreateLesson();
  const [courseId, setCourseId] = useState(defaultCourseId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [quick, setQuick] = useState<number | null>(30);
  const [dayIdx, setDayIdx] = useState(1);
  const [slot, setSlot] = useState(18 * 60);
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState("40");
  const [error, setError] = useState("");

  const days = useMemo(() => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    return Array.from({ length: 31 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d;
    });
  }, []);

  const picked = courses.find((c) => c.id === courseId)?.id ?? courses[0]?.id ?? "";

  const submit = () => {
    const t = title.trim();
    const d = description.trim();
    const p = parseInt(price, 10);
    if (t.length < 3 || t.length > 80) return setError("Başlık 3-80 karakter olmalı.");
    if (d.length < 5 || d.length > 500) return setError("Açıklama 5-500 karakter olmalı.");
    if (!Number.isFinite(p) || p < 10 || p > 500) return setError("Fiyat 10-500 kredi olmalı.");
    if (!picked) return setError("Bir ders seç.");
    let when: Date;
    if (quick != null) {
      when = new Date(Date.now() + quick * 60_000);
    } else {
      when = new Date(days[dayIdx]);
      when.setHours(Math.floor(slot / 60), slot % 60, 0, 0);
    }
    if (when.getTime() < Date.now() + 60_000)
      return setError("Başlangıç zamanı gelecekte olmalı.");
    setError("");
    create.mutate(
      {
        courseId: picked,
        title: t,
        description: d,
        scheduledAt: when.toISOString(), // Z'li ISO (rapor: mutlaka UTC ya da offset'li)
        durationMinutes: duration,
        price: p,
      },
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
        Eğitim ver
      </T>
      <T style={{ color: C.muted, fontSize: 12, lineHeight: 17, marginBottom: 14 }}>
        Bir öğrenci satın alınca randevu saatinde görüntülü görüşürsün; kredi onaydan sonra sana
        geçer.
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
      <Field label="Başlık" value={title} onChange={setTitle} placeholder="Örn. Limit ve süreklilik" maxLength={80} />
      <Field
        label="Açıklama"
        value={description}
        onChange={setDescription}
        placeholder="Neleri işleyeceksin?"
        multiline
        maxLength={500}
      />

      <T f="bb" style={{ fontSize: 12, color: C.muted, marginBottom: 7 }}>
        Ne zaman başlasın?
      </T>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
        {QUICK.map((o) => (
          <Chip key={o.label} active={quick === o.min} onPress={() => setQuick(o.min)}>
            {o.label}
          </Chip>
        ))}
      </View>

      {quick == null && (
        <>
          <T f="bb" style={{ fontSize: 12, color: C.muted, marginBottom: 7 }}>
            Gün
          </T>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -20, marginBottom: 14 }}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 7 }}
          >
            {days.map((d, i) => (
              <Chip key={i} active={dayIdx === i} onPress={() => setDayIdx(i)}>
                {i === 0 ? "Bugün" : i === 1 ? "Yarın" : d.toLocaleDateString("tr-TR", DAY_FMT)}
              </Chip>
            ))}
          </ScrollView>

          <T f="bb" style={{ fontSize: 12, color: C.muted, marginBottom: 7 }}>
            Saat
          </T>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -20, marginBottom: 14 }}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 7 }}
          >
            {SLOTS.map((m) => (
              <Chip key={m} active={slot === m} onPress={() => setSlot(m)}>
                {slotLabel(m)}
              </Chip>
            ))}
          </ScrollView>
        </>
      )}

      <T f="bb" style={{ fontSize: 12, color: C.muted, marginBottom: 7 }}>
        Süre (en kısa süre sunucu ayarına göre değişir)
      </T>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
        {DURATIONS.map((m) => (
          <Chip key={m} active={duration === m} onPress={() => setDuration(m)}>
            {`${m} dk`}
          </Chip>
        ))}
      </View>

      <Field
        label="Fiyat (kredi, 10-500)"
        value={price}
        onChange={(v) => setPrice(v.replace(/[^0-9]/g, ""))}
        inputProps={{ keyboardType: "number-pad" }}
        maxLength={3}
      />
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
