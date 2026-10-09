import React, { useState } from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Volume2 } from "lucide-react-native";
import { C, DIAG, G_PRIMARY } from "@/theme";
import { errorMessage } from "@/api/errors";
import { useCourses } from "@/queries";
import { Chip, GradBtn, Sheet, T } from "@/components/ui";

export type OnboardingSheetProps = {
  toast: string;
  /** Seçilen ders id'leriyle tercihleri kaydeder (PUT /me/preferences) */
  onContinue: (courseIds: string[]) => Promise<void>;
};

export function OnboardingSheet(p: OnboardingSheetProps) {
  const { data: courses = [] } = useCourses();
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const submit = async () => {
    if (busy || selected.length === 0) return;
    setBusy(true);
    setError("");
    try {
      await p.onContinue(selected);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <Sheet onClose={() => {}} toast={p.toast}>
      <View style={{ alignItems: "center", paddingBottom: 6 }}>
        <LinearGradient
          colors={G_PRIMARY}
          {...DIAG}
          style={{
            width: 52,
            height: 52,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
          }}
        >
          <Volume2 size={23} color="#fff" />
        </LinearGradient>
        <T f="h" style={{ fontSize: 22, textAlign: "center", marginBottom: 7 }}>
          Bugün hangi dersleri çalışıyorsun?
        </T>
        <T style={{ color: C.muted, fontSize: 12, marginBottom: 17 }}>
          Akışını sana göre hazırlayalım.
        </T>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 8,
            marginBottom: 18,
          }}
        >
          {courses.map((c) => (
            <Chip
              key={c.id}
              active={selected.includes(c.id)}
              onPress={() => toggle(c.id)}
            >
              {c.name}
            </Chip>
          ))}
        </View>
        {error ? (
          <T f="bs" style={{ color: C.error, fontSize: 12, marginBottom: 10 }}>
            {error}
          </T>
        ) : null}
        <GradBtn
          label={busy ? "Kaydediliyor..." : "Devam et"}
          colors={G_PRIMARY}
          style={{ alignSelf: "stretch" }}
          disabled={busy || selected.length === 0}
          onPress={submit}
        />
      </View>
    </Sheet>
  );
}