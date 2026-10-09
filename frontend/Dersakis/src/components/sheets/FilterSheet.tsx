import React from "react";
import { View } from "react-native";
import { G_PRIMARY } from "@/theme";
import { useCourseNames } from "@/queries";
import { Chip, GradBtn, Sheet, T } from "@/components/ui";

export type FilterSheetProps = {
  toast: string;
  courseFilter: string;
  onClose: () => void;
  onCourseChange: (c: string) => void;
};

export function FilterSheet(p: FilterSheetProps) {
  const courses = useCourseNames();
  return (
    <Sheet onClose={p.onClose} toast={p.toast}>
      <T f="h" style={{ fontSize: 21, marginTop: 3, marginBottom: 15 }}>
        Dersini seç
      </T>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 18,
        }}
      >
        <Chip
          active={p.courseFilter === "Tümü"}
          onPress={() => p.onCourseChange("Tümü")}
        >
          Tümü
        </Chip>
        {courses.map((c) => (
          <Chip
            key={c}
            active={p.courseFilter === c}
            onPress={() => p.onCourseChange(c)}
          >
            {c}
          </Chip>
        ))}
      </View>
      <GradBtn
        label="Uygula"
        colors={G_PRIMARY}
        onPress={p.onClose}
      />
    </Sheet>
  );
}