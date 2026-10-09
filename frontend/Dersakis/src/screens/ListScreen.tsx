import React from "react";
import { ScrollView, TextInput, View } from "react-native";
import { ArrowLeft, PlayCircle, Search } from "lucide-react-native";
import { C, FONT, SH } from "@/theme";
import type { LiveSessionDto } from "@/api/types";
import { LiveCard } from "@/components/live";
import type { QaQuestion } from "@/api/qa";
import { Avatar, Press, Sonar, T } from "@/components/ui";

export type ListScreenProps = {
  topInset: number;
  bodyPad: number;
  listType: "lessons" | "voice" | "mine" | "questions";
  searchText: string;
  liveItems: LiveSessionDto[];
  liveLoading: boolean;
  liveError: boolean;
  questionsError: boolean;
  onRetry: () => void;
  hasMoreLive: boolean;
  loadingMoreLive: boolean;
  onLoadMoreLive: () => void;
  onOpenSession: (id: string) => void;
  listQuestions: QaQuestion[];
  questionsLoading: boolean;
  hasMoreQuestions: boolean;
  loadingMoreQuestions: boolean;
  onLoadMoreQuestions: () => void;
  onBack: () => void;
  onSearchChange: (v: string) => void;
  onOpenQuestion: (q: QaQuestion) => void;
};

export function ListScreen(p: ListScreenProps) {
  const isQ = p.listType === "questions";
  const failed = isQ
    ? p.questionsError && p.listQuestions.length === 0
    : p.liveError && p.liveItems.length === 0;
  const loading = isQ ? p.questionsLoading : p.liveLoading;
  const listEmpty = !failed && !loading && (isQ ? p.listQuestions.length === 0 : p.liveItems.length === 0);

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
            {p.listType === "lessons"
              ? "Tüm eğitimler"
              : p.listType === "voice"
                ? "Tüm sesli sorular"
                : p.listType === "mine"
                  ? "Oturumlarım"
                  : "Tüm sorular"}
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
        {p.listType !== "questions"
          ? p.liveItems.map((item) => (
              <View key={item.id} style={{ marginBottom: 12 }}>
                <LiveCard s={item} width="100%" onOpen={p.onOpenSession} />
              </View>
            ))
          : p.listQuestions.map((item) => (
              <Press
                key={item.id}
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
                  {item.authorName} · {item.category} · {item.answerCount} cevap
                  {item.hasBestAnswer ? " · ✓ çözüldü" : ""}
                </T>
              </Press>
            ))}
        {p.listType !== "questions" && p.hasMoreLive && (
          <Press onPress={p.onLoadMoreLive} style={{ alignItems: "center", padding: 12 }}>
            <T f="bb" style={{ color: C.tide, fontSize: 12 }}>
              {p.loadingMoreLive ? "Yükleniyor…" : "Daha fazla göster"}
            </T>
          </Press>
        )}
        {p.listType === "questions" && p.hasMoreQuestions && (
          <Press
            onPress={p.onLoadMoreQuestions}
            style={{ alignItems: "center", padding: 12 }}
          >
            <T f="bb" style={{ color: C.tide, fontSize: 12 }}>
              {p.loadingMoreQuestions ? "Yükleniyor…" : "Daha fazla göster"}
            </T>
          </Press>
        )}
        {loading && (
          <T style={{ color: C.muted, fontSize: 12, textAlign: "center", marginTop: 30 }}>
            Yükleniyor…
          </T>
        )}
        {failed && (
          <View style={{ marginTop: 50, alignItems: "center", gap: 12 }}>
            <T style={{ color: C.error, fontSize: 12, textAlign: "center" }}>
              Liste yüklenemedi. Bağlantını kontrol edip tekrar dene.
            </T>
            <Press onPress={p.onRetry}>
              <T f="bb" style={{ color: C.tide, fontSize: 12 }}>
                Tekrar dene
              </T>
            </Press>
          </View>
        )}
        {listEmpty && (
          <View style={{ marginTop: 70, alignItems: "center" }}>
            <View style={{ position: "absolute", top: -35, opacity: 0.5 }}>
              <Sonar size={120} color="rgba(27,107,255,.2)" />
            </View>
            <Search size={27} color={C.tide} />
            <T f="bb" style={{ marginTop: 14 }}>
              {p.searchText.trim() ? "Sonuç bulunamadı." : "Burada henüz bir şey yok."}
            </T>
            <T style={{ color: C.muted, fontSize: 12, marginTop: 5 }}>
              {p.searchText.trim() ? "Başka bir kelime dene." : "Sonra tekrar bak."}
            </T>
          </View>
        )}
      </ScrollView>
    </View>
  );
}