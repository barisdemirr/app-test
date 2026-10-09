import React from "react";
import { ScrollView, View } from "react-native";
import { PlayCircle } from "lucide-react-native";
import { C, SH } from "@/theme";
import {
  flattenFeed,
  useCourseNames,
  useSavedVideos,
  useVideoFlag,
} from "@/queries";
import { errorMessage } from "@/api/errors";
import {
  CreditHistory,
  InviteSection,
  NotificationSettings,
  ProfileHeader,
  StatsSection,
} from "@/components/profile";
import { Chip, GradBtn, SectionTitle, T } from "@/components/ui";

export type ProfileScreenProps = {
  bodyPad: number;
  earnedToday: number;
  stats: { total: number; correct: number };
  selectedCourses: string[];
  interests: string[];
  availableInterests: string[];
  onToggleCourse: (c: string) => void;
  onToggleInterest: (c: string) => void;
  onWatchSaved: (id: string) => void;
  onLogout: () => void;
  showToast: (m: string) => void;
};

export function ProfileScreen(p: ProfileScreenProps) {
  const courses = useCourseNames();
  const savedQ = useSavedVideos();
  const flag = useVideoFlag();
  // "Çıkar"a basılan video, liste yeniden çekilene kadar görünmesin
  const savedItems = flattenFeed(savedQ.data).filter((v) => v.saved);
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
      <ProfileHeader showToast={p.showToast} />

      <View style={{ flexDirection: "row", gap: 8, marginVertical: 14 }}>
        {[
          [String(p.stats.total), "çözülen soru"],
          [String(p.earnedToday), "bugün kazanılan"],
          [String(savedItems.length), "kaydedilen"],
        ].map(([v, label]) => (
          <View
            key={label}
            style={[
              {
                flex: 1,
                borderRadius: 15,
                paddingVertical: 12,
                alignItems: "center",
                backgroundColor: "#fff",
              },
              SH.soft,
            ]}
          >
            <T f="h" style={{ fontSize: 18, color: C.tide }}>
              {v}
            </T>
            <T style={{ fontSize: 9, color: C.muted, marginTop: 3 }}>{label}</T>
          </View>
        ))}
      </View>

      <StatsSection />

      <SectionTitle title="Kaydettiğim videolar" />
      {savedQ.isLoading ? (
        <View style={{ padding: 15, borderRadius: 17, backgroundColor: "#fff" }}>
          <T style={{ color: C.muted, fontSize: 12 }}>Yükleniyor…</T>
        </View>
      ) : savedItems.length === 0 ? (
        <View style={{ padding: 15, borderRadius: 17, backgroundColor: "#fff" }}>
          <T style={{ color: C.muted, fontSize: 12 }}>
            Henüz kaydettiğin video yok. Akışta bir videoya yer imi ekle.
          </T>
        </View>
      ) : (
        <>
          {savedItems.map((v) => (
            <View
              key={v.id}
              style={{
                padding: 12,
                backgroundColor: "#fff",
                borderRadius: 15,
                flexDirection: "row",
                alignItems: "center",
                gap: 9,
                marginBottom: 8,
              }}
            >
              <PlayCircle size={20} color={C.tide} />
              <T f="bs" style={{ flex: 1, fontSize: 11 }} numberOfLines={2}>
                {v.title}
              </T>
              <Chip onPress={() => p.onWatchSaved(v.id)}>İzle</Chip>
              <Chip
                onPress={() =>
                  flag.mutate(
                    { id: v.id, kind: "save", active: false },
                    { onError: (e) => p.showToast(errorMessage(e)) },
                  )
                }
              >
                Çıkar
              </Chip>
            </View>
          ))}
          {savedQ.hasNextPage && (
            <Chip onPress={() => savedQ.fetchNextPage()}>
              {savedQ.isFetchingNextPage ? "Yükleniyor…" : "Daha fazla göster"}
            </Chip>
          )}
        </>
      )}

      <SectionTitle title="Tercihlerim" />
      <T f="bb" style={{ fontSize: 12, marginBottom: 9 }}>
        Derslerim
      </T>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
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
      <T f="bb" style={{ fontSize: 12, marginTop: 16, marginBottom: 9 }}>
        Biliyor muydun? kartları
      </T>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
        {p.availableInterests.map((c) => (
          <Chip
            key={c}
            active={p.interests.includes(c)}
            onPress={() => p.onToggleInterest(c)}
          >
            {c}
          </Chip>
        ))}
      </View>

      <NotificationSettings />
      <InviteSection />
      <CreditHistory />

      <GradBtn
        label="Çıkış yap"
        colors={[C.muted, C.muted]}
        style={{ marginTop: 28 }}
        onPress={p.onLogout}
      />
    </ScrollView>
  );
}