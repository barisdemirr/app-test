import React from "react";
import { FlatList, ScrollView, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import {
  ChevronDown,
  Flame,
  PlayCircle,
  Search,
  Sparkles,
} from "lucide-react-native";
import { C, DIAG, FONT, fin, G_PRIMARY, SH } from "@/theme";
import type { Lesson, Question } from "@/types";
import { courses } from "@/mocks";
import {
  Avatar,
  Chip,
  GradBtn,
  MiniPill,
  Press,
  SectionTitle,
  Sonar,
  T,
} from "@/components/ui";

export type HomeScreenProps = {
  credits: number;
  earnedToday: number;
  dailyCap: number;
  streak: number;
  accuracyPct: number;
  selectedCourses: string[];
  joinedCourses: string[];
  searchText: string;
  courseFilter: string;
  filteredLessons: Lesson[];
  filteredQuestions: Question[];
  bodyPad: number;
  onSearchChange: (v: string) => void;
  onCourseFilterChange: (c: string) => void;
  onOpenFilter: () => void;
  onOpenList: (t: "lessons" | "questions") => void;
  onOpenFeed: () => void;
  onOpenQuestion: (q: Question) => void;
  onOpenAsk: () => void;
  onJoinCourse: (title: string) => void;
};

export function HomeScreen(p: HomeScreenProps) {
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
    <ScrollView {...scrollProps}>
      <LinearGradient
        colors={[C.abyss, C.deep, "#28A6CB"]}
        locations={[0.02, 0.55, 1]}
        {...DIAG}
        style={[
          fin,
          {
            marginTop: 4,
            minHeight: 238,
            padding: 21,
            paddingTop: 23,
            overflow: "hidden",
          },
          SH.card,
        ]}
      >
        <View
          style={{ position: "absolute", right: 20, top: 30, opacity: 0.45 }}
        >
          <Sonar size={120} />
        </View>
        <View
          style={{
            position: "absolute",
            right: 40,
            top: 40,
            width: 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: "rgba(255,255,255,.6)",
          }}
        />
        <View
          style={{
            position: "absolute",
            right: 70,
            top: 22,
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: "rgba(255,255,255,.65)",
          }}
        />
        <T f="bb" style={{ fontSize: 12, letterSpacing: 1.2, color: "#AEEBF2" }}>
          SELAM ADA
        </T>
        <T
          f="h"
          style={{
            fontSize: 27,
            lineHeight: 30,
            color: "#fff",
            marginTop: 7,
            marginBottom: 8,
            letterSpacing: -0.7,
          }}
        >
          {"Merhaba Ada,\ndalışa hazır mısın?"}
        </T>
        <T style={{ fontSize: 13, color: C.mist }}>
          Bugün 2 video izle, kredini katla
        </T>
        <GradBtn
          label="Akışa dal  ↗"
          onPress={p.onOpenFeed}
          style={{ alignSelf: "flex-start", marginTop: 17 }}
        />
        <View
          style={{
            flexDirection: "row",
            gap: 18,
            marginTop: 17,
            alignItems: "center",
          }}
        >
          <T style={{ fontSize: 11, color: "#EAF5FF" }}>
            ✦{" "}
            <T f="bb" style={{ fontSize: 11, color: "#EAF5FF" }}>
              {p.credits}
            </T>{" "}
            kredi
          </T>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <Flame size={12} color="#EAF5FF" />
            <T style={{ fontSize: 11, color: "#EAF5FF" }}>
              <T f="bb" style={{ fontSize: 11, color: "#EAF5FF" }}>
                {p.streak}
              </T>{" "}
              gün seri
            </T>
          </View>
          <T style={{ fontSize: 11, color: "#EAF5FF" }}>
            <T f="bb" style={{ fontSize: 11, color: "#EAF5FF" }}>
              %{p.accuracyPct}
            </T>{" "}
            doğruluk
          </T>
        </View>
        <Svg
          width="100%"
          height={29}
          viewBox="0 0 360 32"
          preserveAspectRatio="none"
          style={{ position: "absolute", bottom: -2, left: 0 }}
        >
          <Path
            d="M0 12 C55 32 82 2 140 15 C196 28 225 3 278 14 C320 23 340 9 360 12 L360 32 L0 32 Z"
            fill="#F2F8FF"
            opacity={0.16}
          />
          <Path
            d="M0 20 C52 5 92 30 150 17 C212 3 237 27 288 17 C322 10 343 24 360 16 L360 32 L0 32 Z"
            fill="#F2F8FF"
            opacity={0.11}
          />
        </Svg>
      </LinearGradient>

      {/* arama */}
      <View style={{ flexDirection: "row", gap: 9, marginTop: 17 }}>
        <View style={{ flex: 1, justifyContent: "center" }}>
          <View style={{ position: "absolute", left: 14, zIndex: 2 }}>
            <Search size={17} color={C.muted} />
          </View>
          <TextInput
            value={p.searchText}
            onChangeText={p.onSearchChange}
            placeholder="Eğitim, soru veya kişi ara"
            placeholderTextColor="#9AA9BD"
            style={{
              height: 46,
              borderRadius: 16,
              paddingLeft: 40,
              paddingRight: 12,
              borderWidth: 1.5,
              borderColor: C.mist,
              backgroundColor: "#fff",
              fontFamily: FONT.b,
              fontSize: 13,
              color: C.ink,
            }}
          />
        </View>
        <Press
          onPress={p.onOpenFilter}
          style={{
            width: 48,
            height: 46,
            borderRadius: 15,
            backgroundColor: "#fff",
            borderWidth: 1,
            borderColor: C.mist,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChevronDown size={18} color={C.tide} />
        </Press>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -20, marginTop: 13 }}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 7 }}
      >
        <Chip
          active={p.courseFilter === "Tümü"}
          onPress={() => p.onCourseFilterChange("Tümü")}
        >
          Tümü
        </Chip>
        {courses.map((c) => (
          <Chip
            key={c}
            active={p.courseFilter === c}
            onPress={() =>
              p.onCourseFilterChange(p.courseFilter === c ? "Tümü" : c)
            }
          >
            {c}
          </Chip>
        ))}
      </ScrollView>

      {/* EĞİTİMLER */}
      <SectionTitle
        title="Eğitimler"
        action="Tümünü gör"
        onAction={() => p.onOpenList("lessons")}
      />
      {p.filteredLessons.length === 0 ? (
        <T style={{ color: C.muted, fontSize: 12 }}>
          Aramana uygun eğitim bulunamadı.
        </T>
      ) : (
        <FlatList
          horizontal
          data={p.filteredLessons}
          keyExtractor={(i) => i.title}
          showsHorizontalScrollIndicator={false}
          snapToInterval={299}
          decelerationRate="fast"
          style={{ marginHorizontal: -20 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 14,
            gap: 13,
          }}
          renderItem={({ item }) => {
            const joined = p.joinedCourses.includes(item.title);
            return (
              <View
                style={[
                  fin,
                  {
                    width: 286,
                    backgroundColor: "#fff",
                    overflow: "hidden",
                    borderWidth: 1,
                    borderColor: "rgba(220,234,247,.8)",
                  },
                  SH.card,
                ]}
              >
                <LinearGradient
                  colors={[C.abyss, item.color, C.lagoon]}
                  {...DIAG}
                  style={{ height: 82, padding: 15, overflow: "hidden" }}
                >
                  <View
                    style={{
                      position: "absolute",
                      right: 20,
                      top: 5,
                      opacity: 0.55,
                    }}
                  >
                    <Sonar size={76} />
                  </View>
                  <View
                    style={{
                      alignSelf: "flex-start",
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 999,
                      backgroundColor: "rgba(255,255,255,.2)",
                    }}
                  >
                    <T f="bb" style={{ color: "#fff", fontSize: 10 }}>
                      {item.course}
                    </T>
                  </View>
                  <T
                    style={{
                      position: "absolute",
                      right: 14,
                      top: 13,
                      fontSize: 10,
                      color: "rgba(255,255,255,.8)",
                    }}
                  >
                    DERSAKIŞ • 01
                  </T>
                </LinearGradient>
                <View style={{ padding: 15 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 9,
                    }}
                  >
                    <Avatar initials={item.initials} color={item.color} size={32} />
                    <View style={{ flex: 1 }}>
                      <T f="bb" style={{ fontSize: 12 }}>
                        {item.teacher}
                      </T>
                      <T
                        style={{ fontSize: 10, color: C.muted }}
                        numberOfLines={1}
                      >
                        {item.role}
                      </T>
                    </View>
                  </View>
                  <T
                    f="h"
                    style={{
                      fontSize: 17,
                      lineHeight: 20,
                      marginTop: 12,
                      marginBottom: 6,
                      minHeight: 40,
                    }}
                    numberOfLines={2}
                  >
                    {item.title}
                  </T>
                  <T
                    style={{
                      fontSize: 11,
                      color: C.muted,
                      lineHeight: 17,
                      minHeight: 51,
                    }}
                    numberOfLines={3}
                  >
                    {item.desc}
                  </T>
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 6,
                      marginTop: 12,
                      marginBottom: 12,
                    }}
                  >
                    <MiniPill label={item.course} color={C.tide} />
                    <MiniPill label="5 soru" />
                    <MiniPill label={item.time} />
                  </View>
                  <GradBtn
                    label={joined ? "✓ Katıldın" : "Eğitime katıl"}
                    colors={
                      joined
                        ? ([C.success, C.success] as const)
                        : undefined
                    }
                    onPress={() => !joined && p.onJoinCourse(item.title)}
                  />
                </View>
              </View>
            );
          }}
        />
      )}

      {/* BİLENE SOR */}
      <SectionTitle
        title="Bilene sor"
        action="Tüm sorular"
        onAction={() => p.onOpenList("questions")}
      />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: -9,
          marginBottom: 10,
        }}
      >
        <T style={{ color: C.muted, fontSize: 11, flex: 1 }}>
          Takıldığın yerde birlikte çözelim.
        </T>
        <GradBtn
          label="＋ Soru sor"
          small
          colors={G_PRIMARY}
          radius={{ borderRadius: 999 }}
          onPress={p.onOpenAsk}
        />
      </View>
      {p.filteredQuestions.length === 0 ? (
        <T style={{ color: C.muted, fontSize: 12 }}>
          Seçtiğin derslerde soru yok. İlk soruyu sen sor.
        </T>
      ) : (
        <FlatList
          horizontal
          data={p.filteredQuestions}
          keyExtractor={(i) => i.text}
          showsHorizontalScrollIndicator={false}
          snapToInterval={272}
          decelerationRate="fast"
          style={{ marginHorizontal: -20 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 12,
            gap: 12,
          }}
          renderItem={({ item }) => (
            <Press
              onPress={() => p.onOpenQuestion(item)}
              style={[
                {
                  width: 260,
                  minHeight: 165,
                  padding: 14,
                  borderTopLeftRadius: 19,
                  borderTopRightRadius: 10,
                  borderBottomRightRadius: 19,
                  borderBottomLeftRadius: 10,
                  borderWidth: 1,
                  borderColor: C.mist,
                  backgroundColor: "#fff",
                },
                SH.soft,
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Avatar initials={item.initials} color={item.color} size={30} />
                <T f="bb" style={{ fontSize: 12 }}>
                  {item.name}
                </T>
                <T style={{ marginLeft: "auto", fontSize: 9, color: C.muted }}>
                  {item.course}
                </T>
              </View>
              <View
                style={{
                  alignSelf: "flex-start",
                  marginTop: 11,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: "#EAF3FF",
                }}
              >
                <T style={{ fontSize: 10, color: C.tide }}>{item.topic}</T>
              </View>
              <T
                f="bs"
                style={{
                  fontSize: 13,
                  lineHeight: 18,
                  marginTop: 8,
                  minHeight: 54,
                }}
                numberOfLines={3}
              >
                {item.text}
              </T>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderTopWidth: 1,
                  borderTopColor: C.foam,
                  paddingTop: 10,
                  marginTop: 8,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Avatar initials="EY" color="#8589F9" size={19} />
                  <View style={{ marginLeft: -5 }}>
                    <Avatar initials="MA" color="#F29C72" size={19} />
                  </View>
                  <T style={{ fontSize: 10, color: C.muted, marginLeft: 6 }}>
                    {item.answers.length} cevap
                  </T>
                </View>
                <T f="bb" style={{ color: C.tide, fontSize: 11 }}>
                  Cevapla →
                </T>
              </View>
            </Press>
          )}
        />
      )}

      <View
        style={{
          padding: 15,
          marginTop: 14,
          borderRadius: 18,
          backgroundColor: "#EAF5FF",
          borderWidth: 1,
          borderColor: C.mist,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            backgroundColor: "#FFF3CB",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Sparkles size={19} color="#D28C17" />
        </View>
        <View style={{ flex: 1 }}>
          <T f="bb" style={{ fontSize: 12 }}>
            Günün bilgisi
          </T>
          <T
            style={{
              fontSize: 11,
              lineHeight: 15,
              color: C.muted,
              marginTop: 3,
            }}
          >
            Işık boşlukta saniyede yaklaşık 300.000 km yol alır.
          </T>
        </View>
      </View>
    </ScrollView>
  );
}