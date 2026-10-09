import React from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Volume2 } from "lucide-react-native";
import { C, DIAG, G_PRIMARY } from "@/theme";
import { courses } from "@/mocks";
import { Chip, GradBtn, Sheet, T } from "@/components/ui";

export type OnboardingSheetProps = {
  toast: string;
  selectedCourses: string[];
  onToggleCourse: (c: string) => void;
  onContinue: () => void;
};

export function OnboardingSheet(p: OnboardingSheetProps) {
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
              key={c}
              active={p.selectedCourses.includes(c)}
              onPress={() => p.onToggleCourse(c)}
            >
              {c}
            </Chip>
          ))}
        </View>
        <GradBtn
          label="Devam et"
          colors={G_PRIMARY}
          style={{ alignSelf: "stretch" }}
          disabled={p.selectedCourses.length === 0}
          onPress={p.onContinue}
        />
      </View>
    </Sheet>
  );
}