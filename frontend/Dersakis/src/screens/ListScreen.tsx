import React from "react";
import { ScrollView, TextInput, View } from "react-native";
import { ArrowLeft, PlayCircle, Search } from "lucide-react-native";
import { C, FONT, SH } from "@/theme";
import type { Lesson, Question } from "@/types";
import { Avatar, Press, Sonar, T } from "@/components/ui";

export type ListScreenProps = {
  topInset: number;
  bodyPad: number;
  listType: "lessons" | "questions";
  searchText: string;
  listLessons: Lesson[];
  listQuestions: Question[];
  onBack: () => void;
  onSearchChange: (v: string) => void;
  onOpenQuestion: (q: Question) => void;
};

export function ListScreen(p: ListScreenProps) {
  const listEmpty =
    (p.listType === "lessons" ? p.listLessons : p.listQuestions).length === 0;

  const scrollProps = {
    showsVerticalScrollIndicator: false,
    keyboardShouldPersistTaps: "handled" as const,
    automaticallyAdjustKeyboardInsets: true,
    contentContainerStyle: {
      paddingHorizontal: 20,
      paddingBottom: p.bodyPad,
    },
  };

  return (
    <View style={{ flex: 1, paddingTop: p.topInset + 12 }}>
      <ScrollView {...scrollProps}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            marginTop: 5,
            marginBottom: 17,
          }}
        >
          <Press
            onPress={p.onBack}
            style={[
              {
                width: 40,
                height: 40,
                borderRadius: 13,
                backgroundColor: "#fff",
                alignItems: "center",
                justifyContent: "center",
              },
              SH.soft,
            ]}
          >
            <ArrowLeft size={19} color={C.abyss} />
          </Press>
          <T f="h" style={{ fontSize: 22 }}>
            {p.listType === "lessons" ? "Tüm eğitimler" : "Tüm sorular"}
          </T>
        </View>
        <View style={{ marginBottom: 14, justifyContent: "center" }}>
          <View style={{ position: "absolute", left: 13, zIndex: 2 }}>
            <Search size={16} color={C.muted} />
          </View>
          <TextInput
            value={p.searchText}
            onChangeText={p.onSearchChange}
            placeholder="Ara..."
            placeholderTextColor="#9AA9BD"
            style={{
              height: 44,
              borderRadius: 15,
              paddingLeft: 38,
              paddingRight: 12,
              borderWidth: 1,
              borderColor: C.mist,
              backgroundColor: "#fff",
              fontFamily: FONT.b,
              fontSize: 13,
              color: C.ink,
            }}
          />
        </View>
        {p.listType === "lessons"
          ? p.listLessons.map((item) => (
              <View
                key={item.title}
                style={[
                  {
                    flexDirection: "row",
                    gap: 11,
                    alignItems: "center",
                    backgroundColor: "#fff",
                    borderRadius: 17,
                    padding: 12,
                    marginBottom: 9,
                  },
                  SH.soft,
                ]}
              >
                <Avatar initials={item.initials} color={item.color} />
                <View style={{ flex: 1 }}>
                  <T f="bb" style={{ fontSize: 12 }}>
                    {item.title}
                  </T>
                  <T style={{ color: C.muted, fontSize: 10, marginTop: 4 }}>
                    {item.teacher} · {item.course}
                  </T>
                </View>
                <PlayCircle size={20} color={C.tide} />
              </View>
            ))
          : p.listQuestions.map((item) => (
              <Press
                key={item.text}
                onPress={() => p.onOpenQuestion(item)}
                style={[
                  {
                    padding: 14,
                    backgroundColor: "#fff",
                    borderRadius: 17,
                    marginBottom: 9,
                  },
                  SH.soft,
                ]}
              >
                <T f="bb" style={{ fontSize: 12 }}>
                  {item.text}
                </T>
                <T style={{ marginTop: 6, color: C.muted, fontSize: 10 }}>
                  {item.name} · {item.course} · {item.answers.length} cevap
                </T>
              </Press>
            ))}
        {listEmpty && (
          <View style={{ marginTop: 70, alignItems: "center" }}>
            <View style={{ position: "absolute", top: -35, opacity: 0.5 }}>
              <Sonar size={120} color="rgba(27,107,255,.2)" />
            </View>
            <Search size={27} color={C.tide} />
            <T f="bb" style={{ marginTop: 14 }}>
              Sonuç bulunamadı.
            </T>
            <T style={{ color: C.muted, fontSize: 12, marginTop: 5 }}>
              Başka bir kelime dene.
            </T>
          </View>
        )}
      </ScrollView>
    </View>
  );
}