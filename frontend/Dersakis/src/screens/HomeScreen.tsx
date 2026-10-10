import React from "react";
import { FlatList, RefreshControl, ScrollView, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import {
  ChevronDown,
  ChevronRight,
  GraduationCap,
  History,
  Mic,
  Search,
  Sparkles,
} from "lucide-react-native";
import { C, DIAG, FONT, fin, G_CORAL, G_PRIMARY, SH } from "@/theme";
import type { LiveSessionDto } from "@/api/types";
import { ActiveStrip, LiveShelf } from "@/components/live";
import type { QaQuestion } from "@/api/qa";
import { colorFor, initialsOf } from "@/utils/user";
import { useCourseNames } from "@/queries";
import { FACTS } from "@/constants/facts";
import {
  AnimatedNumber,
  Avatar,
  Chip,
  Enter,
  GradBtn,
  Press,
  SectionTitle,
  Skeleton,
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
  liveError: boolean;
  questionsError: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onOpenSession: (id: string) => void;
  onJoinSession: (s: LiveSessionDto) => void;
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

function ActionTile({
  colors,
  icon,
  title,
  sub,
  onPress,
}: {
  colors: readonly [string, string];
  icon: React.ReactNode;
  title: string;
  sub: string;
  onPress: () => void;
}) {
  return (
    <Press
      onPress={onPress}
      style={[{ flex: 1, borderRadius: 20, overflow: "hidden", padding: 14, minHeight: 92, justifyContent: "space-between" }, SH.soft]}
    >
      <LinearGradient colors={colors} {...DIAG} style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} />
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          backgroundColor: "rgba(255,255,255,.24)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>
      <View>
        <T f="h" style={{ color: "#fff", fontSize: 15 }} numberOfLines={1}>
          {title}
        </T>
        <T style={{ color: "rgba(255,255,255,.88)", fontSize: 10.5, marginTop: 1 }} numberOfLines={1}>
          {sub}
        </T>
      </View>
    </Press>
  );
}

export function HomeScreen(p: HomeScreenProps) {
  const courses = useCourseNames();
  const firstName = (p.userName.trim().split(" ")[0] || "").toLocaleUpperCase("tr-TR");
  // Günlük ilerleme sunucudan (GET /credits/balance); sabit metin yok
  const dailyLine =
    p.dailyCap <= 0
      ? "Video izle, quiz çöz, kredini katla"
      : p.earnedToday >= p.dailyCap
        ? "Bugünkü quiz kredisi tavanına ulaştın"
        : `Bugün ${p.earnedToday}/${p.dailyCap} kredi kazandın, quiz çözerek devam et`;
  // Günün bilgisi: gün sayısına göre döner (istemci sabiti, sunucu içeriği değil)
  const fact = FACTS[Math.floor(Date.now() / 86_400_000) % FACTS.length];
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
    <ScrollView
      {...scrollProps}
      refreshControl={
        <RefreshControl refreshing={p.refreshing} onRefresh={p.onRefresh} tintColor={C.tide} />
      }
    >
      <Enter y={10}>
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
          <Sonar size={120} animated />
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
        <T style={{ fontSize: 13, color: C.mist }}>{dailyLine}</T>
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
            <AnimatedNumber value={p.credits} f="bb" style={{ fontSize: 11, color: "#EAF5FF" }} />{" "}
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
      </Enter>

      {/* hızlı eylemler */}
      <Enter delay={90}>
        <View style={{ flexDirection: "row", gap: 11, marginTop: 14 }}>
          <ActionTile
            colors={G_CORAL}
            icon={<Mic size={20} color="#fff" />}
            title="Sesli soru sor"
            sub="Anında birine sor"
            onPress={p.onCreateVoice}
          />
          <ActionTile
            colors={G_PRIMARY}
            icon={<GraduationCap size={21} color="#fff" />}
            title="Eğitim ver"
            sub="Bilgini paylaş, kazan"
            onPress={p.onCreateLesson}
          />
        </View>
        <Press
          onPress={() => p.onOpenList("mine")}
          style={{
            marginTop: 9,
            flexDirection: "row",
            alignItems: "center",
            gap: 9,
            paddingHorizontal: 14,
            minHeight: 44,
            borderRadius: 14,
            backgroundColor: "#fff",
            borderWidth: 1,
            borderColor: C.mist,
          }}
        >
          <History size={16} color={C.tide} />
          <T f="bs" style={{ fontSize: 12.5, flex: 1 }}>
            Oturumlarım
          </T>
          <T style={{ fontSize: 11, color: C.muted }}>geçmiş dahil</T>
          <ChevronRight size={16} color={C.muted} />
        </Press>
      </Enter>

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
      <ActiveStrip
        items={p.activeSessions}
        onOpen={p.onOpenSession}
        onJoin={p.onJoinSession}
        onSeeAll={() => p.onOpenList("mine")}
      />

      {/* SESLİ SORULAR */}
      <LiveShelf
        title="Sesli sorular"
        action="Tümünü gör"
        onSeeAll={() => p.onOpenList("voice")}
        items={p.voiceSessions}
        loading={p.liveLoading}
        error={p.liveError}
        empty="Şu an açık sesli soru yok. İlk soruyu sen sor, biri katılınca haber veririz."
        emptyAction={
          <GradBtn label="＋ Sesli soru sor" small colors={G_CORAL} radius={{ borderRadius: 999 }} onPress={p.onCreateVoice} />
        }
        onOpen={p.onOpenSession}
        onJoin={p.onJoinSession}
      />

      {/* EĞİTİMLER */}
      <LiveShelf
        title="Eğitimler"
        action="Tümünü gör"
        onSeeAll={() => p.onOpenList("lessons")}
        items={p.lessonSessions}
        loading={p.liveLoading}
        error={p.liveError}
        empty="Şu an satışta eğitim yok. Sen bir eğitim açabilirsin."
        emptyAction={
          <GradBtn label="＋ Eğitim ver" small colors={G_PRIMARY} radius={{ borderRadius: 999 }} onPress={p.onCreateLesson} />
        }
        onOpen={p.onOpenSession}
        onJoin={p.onJoinSession}
      />

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
        <View style={{ gap: 10 }}>
          <Skeleton style={{ height: 120, borderRadius: 18 }} />
        </View>
      ) : p.questionsError && p.filteredQuestions.length === 0 ? (
        <T style={{ color: C.error, fontSize: 12 }}>
          Sorular yüklenemedi. Ekranı aşağı çekip yenile.
        </T>
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
                  {item.isMine || item.hasBestAnswer ? "Gör →" : "Cevapla →"}
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
            {fact.text}
          </T>
        </View>
      </View>
    </ScrollView>
  );
}