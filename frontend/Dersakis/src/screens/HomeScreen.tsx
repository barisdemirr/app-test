import React from "react";
import { FlatList, ScrollView, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import {
  ChevronDown,
  PlayCircle,
  Search,
  Sparkles,
} from "lucide-react-native";
import { C, DIAG, FONT, fin, G_PRIMARY, SH } from "@/theme";
import type { LiveSessionDto } from "@/api/types";
import { ActiveStrip, LiveShelf } from "@/components/live";
import type { QaQuestion } from "@/api/qa";
import { colorFor, initialsOf } from "@/utils/user";
import { useCourseNames } from "@/queries";
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
  userName: string;
  accuracyPct: number;
  selectedCourses: string[];
  searchText: string;
  courseFilter: string;
  activeSessions: LiveSessionDto[];
  voiceSessions: LiveSessionDto[];
  lessonSessions: LiveSessionDto[];
  liveLoading: boolean;
  onOpenSession: (id: string) => void;
  onCreateVoice: () => void;
  onCreateLesson: () => void;
  filteredQuestions: QaQuestion[];
  questionsLoading: boolean;
  bodyPad: number;
  onSearchChange: (v: string) => void;
  onCourseFilterChange: (c: string) => void;
  onOpenFilter: () => void;
  onOpenList: (t: "lessons" | "voice" | "mine" | "questions") => void;
  onOpenFeed: () => void;
  onOpenQuestion: (q: QaQuestion) => void;
  onOpenAsk: () => void;
};

export function HomeScreen(p: HomeScreenProps) {
  const courses = useCourseNames();
  const firstName = (p.userName.trim().split(" ")[0] || "").toLocaleUpperCase("tr-TR");
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
          {firstName ? `SELAM ${firstName}` : "SELAM"}
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
          {`Merhaba ${p.userName.trim().split(" ")[0] || ""},\ndalışa hazır mısın?`}
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

      {/* DEVAM EDEN / YAKLAŞAN */}
      <ActiveStrip items={p.activeSessions} onOpen={p.onOpenSession} />

      {/* SESLİ SORULAR */}
      <LiveShelf
        title="Sesli sorular"
        action="Tümünü gör"
        onSeeAll={() => p.onOpenList("voice")}
        items={p.voiceSessions}
        loading={p.liveLoading}
        empty="Şu an açık sesli soru yok."
        onOpen={p.onOpenSession}
      />
      <View style={{ flexDirection: "row", gap: 8, marginTop: -4, marginBottom: 6 }}>
        <GradBtn label="＋ Sesli soru sor" small colors={G_PRIMARY} radius={{ borderRadius: 999 }} onPress={p.onCreateVoice} />
      </View>

      {/* EĞİTİMLER */}
      <LiveShelf
        title="Eğitimler"
        action="Tümünü gör"
        onSeeAll={() => p.onOpenList("lessons")}
        items={p.lessonSessions}
        loading={p.liveLoading}
        empty="Aramana uygun eğitim bulunamadı."
        onOpen={p.onOpenSession}
      />
      <View style={{ flexDirection: "row", gap: 8, marginTop: -4, marginBottom: 6 }}>
        <GradBtn label="＋ Eğitim ver" small colors={G_PRIMARY} radius={{ borderRadius: 999 }} onPress={p.onCreateLesson} />
        <GradBtn label="Oturumlarım" small colors={[C.tide, C.tide]} radius={{ borderRadius: 999 }} onPress={() => p.onOpenList("mine")} />
      </View>

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
      {p.questionsLoading ? (
        <T style={{ color: C.muted, fontSize: 12 }}>Yükleniyor…</T>
      ) : p.filteredQuestions.length === 0 ? (
        <T style={{ color: C.muted, fontSize: 12 }}>
          Seçtiğin derslerde soru yok. İlk soruyu sen sor.
        </T>
      ) : (
        <FlatList
          horizontal
          data={p.filteredQuestions}
          keyExtractor={(i) => i.id}
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
                <Avatar
                  initials={initialsOf(item.authorName)}
                  color={colorFor(item.authorId)}
                  size={30}
                />
                <T f="bb" style={{ fontSize: 12 }}>
                  {item.authorName}
                </T>
                <T style={{ marginLeft: "auto", fontSize: 9, color: C.muted }}>
                  {item.category}
                </T>
              </View>
              {item.topic ? (
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
              ) : null}
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
                <T style={{ fontSize: 10, color: C.muted }}>
                  {item.answerCount} cevap{item.hasBestAnswer ? " · ✓ çözüldü" : ""}
                </T>
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