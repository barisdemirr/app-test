import React from "react";
import { ScrollView, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { PlayCircle, Plus } from "lucide-react-native";
import { C, DIAG, fin, HORZ, SH } from "@/theme";
import { courses, interestsList } from "@/mocks";
import type { Reel } from "@/types";
import {
  Avatar,
  Chip,
  Field,
  GradBtn,
  Press,
  SectionTitle,
  T,
} from "@/components/ui";

export type ProfileScreenProps = {
  bodyPad: number;
  bio: string;
  credits: number;
  earnedToday: number;
  streak: number;
  stats: { total: number; correct: number };
  finishedCount: number;
  saved: string[];
  reels: Reel[];
  selectedCourses: string[];
  interests: string[];
  onBioChange: (v: string) => void;
  onSaveBio: () => void;
  onToggleCourse: (c: string) => void;
  onToggleInterest: (c: string) => void;
  onUnsave: (id: string) => void;
  onWatchSaved: (id: string) => void;
  onPhoto: () => void;
  onLogout: () => void;
};

export function ProfileScreen(p: ProfileScreenProps) {
  const scrollProps = {
    showsVerticalScrollIndicator: false,
    keyboardShouldPersistTaps: "handled" as const,
    automaticallyAdjustKeyboardInsets: true,
    contentContainerStyle: {
      paddingHorizontal: 20,
      paddingBottom: p.bodyPad,
    },
  };

  const acc = Math.round((p.stats.correct / p.stats.total) * 100);

  return (
    <ScrollView {...scrollProps}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 13,
          paddingTop: 10,
          paddingBottom: 13,
        }}
      >
        <View>
          <Avatar initials="AY" color="#7276F4" size={70} />
          <Press
            onPress={p.onPhoto}
            style={{
              position: "absolute",
              right: -3,
              bottom: -2,
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: C.coral,
              borderWidth: 2,
              borderColor: "#fff",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Plus size={14} color="#fff" />
          </Press>
        </View>
        <View style={{ flex: 1 }}>
          <T f="h" style={{ fontSize: 22 }}>
            Ada Yılmaz
          </T>
          <T style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>
            @adayilmaz · Fotoğrafı değiştirmek için dokun
          </T>
        </View>
      </View>

      <View
        style={[
          { backgroundColor: "#fff", padding: 14, borderRadius: 18 },
          SH.soft,
        ]}
      >
        <Field
          label="Kısa biyografi"
          value={p.bio}
          onChange={p.onBioChange}
          multiline
          maxLength={160}
        />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: -7,
          }}
        >
          <T style={{ color: C.muted, fontSize: 10 }}>{p.bio.length}/160</T>
          <GradBtn
            label="Kaydet"
            small
            colors={[C.tide, C.tide]}
            radius={{ borderRadius: 11 }}
            onPress={p.onSaveBio}
          />
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 8, marginVertical: 14 }}>
        {[
          [String(12 + p.finishedCount), "video izlendi"],
          [String(p.earnedToday), "bugün kazanılan"],
          [String(p.saved.length), "kaydedilen"],
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

      <SectionTitle title="Derslerdeki başarım" />
      <LinearGradient
        colors={[C.deep, C.tide]}
        {...HORZ}
        style={[
          fin,
          {
            flexDirection: "row",
            alignItems: "center",
            gap: 13,
            padding: 17,
            marginTop: -5,
          },
        ]}
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            borderWidth: 4,
            borderColor: "rgba(255,255,255,.22)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <T f="h" style={{ color: "#fff", fontSize: 15 }}>
            {acc}%
          </T>
        </View>
        <View style={{ flex: 1 }}>
          <T f="bb" style={{ color: "#fff", fontSize: 14 }}>
            Genel doğruluk
          </T>
          <T style={{ color: "#CFE2F6", fontSize: 10, marginTop: 3 }}>
            {p.stats.total} soru çözdün, {p.stats.correct} doğru. Böyle devam!
          </T>
        </View>
      </LinearGradient>

      {courses
        .filter((c) => p.selectedCourses.includes(c))
        .map((c, i) => {
          const pct = i % 2 === 1 ? 58 : 72;
          const low = pct < 60;
          return (
            <View
              key={c}
              style={[
                {
                  marginTop: 9,
                  padding: 13,
                  borderRadius: 15,
                  backgroundColor: "#fff",
                },
                SH.soft,
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <T f="bb" style={{ fontSize: 12 }}>
                  {c}
                </T>
                <T f="bb" style={{ fontSize: 12, color: low ? C.coral : C.tide }}>
                  {pct}%
                </T>
              </View>
              <View
                style={{
                  height: 5,
                  marginTop: 9,
                  marginBottom: 6,
                  borderRadius: 8,
                  backgroundColor: C.mist,
                }}
              >
                <View
                  style={{
                    width: `${pct}%`,
                    height: 5,
                    borderRadius: 8,
                    backgroundColor: low ? C.coral : C.tide,
                  }}
                />
              </View>
              <T style={{ fontSize: 10, color: C.muted }}>
                25 çözülen · 18 doğru
              </T>
            </View>
          );
        })}

      <SectionTitle title="Kaydettiğim videolar" />
      {p.saved.length === 0 ? (
        <View style={{ padding: 15, borderRadius: 17, backgroundColor: "#fff" }}>
          <T style={{ color: C.muted, fontSize: 12 }}>
            Henüz kaydettiğin video yok. Akışta bir videoya yer imi ekle.
          </T>
        </View>
      ) : (
        p.saved.map((id) => {
          const r = p.reels.find((x) => x.id === id);
          if (!r) return null;
          return (
            <View
              key={id}
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
                {r.title}
              </T>
              <Chip onPress={() => p.onWatchSaved(id)}>İzle</Chip>
              <Chip onPress={() => p.onUnsave(id)}>Çıkar</Chip>
            </View>
          );
        })
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
        {interestsList.map((c) => (
          <Chip
            key={c}
            active={p.interests.includes(c)}
            onPress={() => p.onToggleInterest(c)}
          >
            {c}
          </Chip>
        ))}
      </View>

      <GradBtn
        label="Çıkış yap"
        colors={[C.muted, C.muted]}
        style={{ marginTop: 28 }}
        onPress={p.onLogout}
      />
    </ScrollView>
  );
}