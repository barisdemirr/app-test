import React, { useRef } from "react";
import { Pressable, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Play,
  Share2,
} from "lucide-react-native";
import { C, DIAG } from "@/theme";
import type { Reel } from "@/types";
import { FACT } from "@/mocks";
import {
  Avatar,
  FadeLine,
  GradBtn,
  GridBg,
  Press,
  Sonar,
  T,
} from "@/components/ui";

export type ReelCardProps = {
  reel: Reel;
  width: number;
  height: number;
  topInset: number;
  bottomOffset: number;
  active: boolean;
  progress: number;
  playing: boolean;
  finished: boolean;
  learned: boolean;
  saved: boolean;
  onTogglePlay: () => void;
  onLearn: () => void;
  onSave: () => void;
  onShare: () => void;
  onQuiz: () => void;
  onReplay: () => void;
  onSeek: (p: number) => void;
  onBack: () => void;
};

export function ReelCard(p: ReelCardProps) {
  const { reel, active, progress, finished } = p;
  const isFact = reel.course === FACT;
  const barW = useRef(1);

  const actions = [
    {
      key: "learn",
      label: "Öğrendim",
      on: p.learned,
      icon: <CheckCircle2 size={20} color={p.learned ? C.sun : "#fff"} />,
      press: p.onLearn,
    },
    {
      key: "save",
      label: "Kaydet",
      on: p.saved,
      icon: (
        <Bookmark
          size={19}
          color={p.saved ? C.sun : "#fff"}
          fill={p.saved ? C.sun : "none"}
        />
      ),
      press: p.onSave,
    },
    {
      key: "share",
      label: "Paylaş",
      on: false,
      icon: <Share2 size={19} color="#fff" />,
      press: p.onShare,
    },
  ];

  return (
    <View style={{ width: p.width, height: p.height, overflow: "hidden" }}>
      <LinearGradient
        colors={[C.abyss, C.deep, "#164B83"]}
        {...DIAG}
        style={{ ...require("react-native").StyleSheet.absoluteFillObject }}
      />
      <GridBg />

      <Pressable
        style={require("react-native").StyleSheet.absoluteFillObject}
        onPress={p.onTogglePlay}
      />

      {/* ders etiketi */}
      <View
        style={{
          position: "absolute",
          left: 66,
          top: p.topInset + 14,
          paddingHorizontal: 11,
          paddingVertical: 8,
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,.13)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,.18)",
        }}
        pointerEvents="none"
      >
        <T f="bs" style={{ color: "#fff", fontSize: 11 }}>
          {reel.course}
        </T>
      </View>

      {/* orta alan */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 18,
          right: 76,
          top: p.topInset + 90,
          bottom: p.bottomOffset + 290,
          justifyContent: "center",
        }}
      >
        <View
          style={{ position: "absolute", alignSelf: "center", opacity: 0.25 }}
        >
          <Sonar size={230} />
        </View>
        {isFact ? (
          <View>
            <T f="bb" style={{ color: C.sun, letterSpacing: 2, fontSize: 12 }}>
              BİLİYOR MUYDUN?
            </T>
            <T
              f="h"
              style={{
                color: "#fff",
                fontSize: 29,
                lineHeight: 34,
                marginTop: 18,
              }}
            >
              {reel.title}
            </T>
            <T style={{ color: "#BBD3EA", fontSize: 12, marginTop: 24 }}>
              Bu kart kredi vermez, kaydırarak geçebilirsin
            </T>
          </View>
        ) : (
          <View>
            {reel.lines.map((line, i) => (
              <FadeLine
                key={`${reel.id}-${i}`}
                text={line}
                on={active && progress * 1.5 - i * 0.19 > 0.05}
                highlight={active && progress > 0.75 && line === reel.result}
              />
            ))}
          </View>
        )}
      </View>

      {/* duraklatıldı göstergesi */}
      {active && !p.playing && progress < 1 && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: p.height * 0.4,
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: "rgba(255,255,255,.18)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Play size={27} color="#fff" fill="#fff" />
          </View>
        </View>
      )}

      {/* sağ aksiyon barı */}
      <View
        style={{
          position: "absolute",
          right: 14,
          bottom: p.bottomOffset + 215,
          gap: 14,
          alignItems: "center",
        }}
      >
        {actions.map((a) => (
          <Press
            key={a.key}
            onPress={a.press}
            style={{ alignItems: "center", gap: 5, width: 50 }}
          >
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: a.on
                  ? "rgba(255,214,107,.22)"
                  : "rgba(255,255,255,.12)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,.2)",
              }}
            >
              {a.icon}
            </View>
            <T style={{ color: a.on ? C.sun : "#fff", fontSize: 9 }}>
              {a.label}
            </T>
          </Press>
        ))}
      </View>

      {/* alt blok */}
      <View
        style={{
          position: "absolute",
          left: 18,
          right: 18,
          bottom: p.bottomOffset + 8,
        }}
      >
        <LinearGradient
          colors={["rgba(3,15,39,0)", "rgba(3,15,39,.7)"]}
          style={{
            position: "absolute",
            left: -18,
            right: -18,
            top: -40,
            bottom: -8,
          }}
          pointerEvents="none"
        />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingRight: 70,
          }}
        >
          <Avatar initials={reel.initials} color={reel.color} size={32} />
          <T f="bb" style={{ color: "#fff", fontSize: 12 }}>
            {reel.creator}
          </T>
          <View
            style={{
              paddingHorizontal: 10,
              minHeight: 27,
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,.17)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <T f="bb" style={{ color: "#fff", fontSize: 10 }}>
              Takip et
            </T>
          </View>
        </View>
        {!isFact && (
          <T
            f="bb"
            style={{
              color: "#fff",
              fontSize: 15,
              lineHeight: 19,
              marginTop: 8,
              paddingRight: 70,
            }}
          >
            {reel.title}
          </T>
        )}
        <View
          style={{
            alignSelf: "flex-start",
            marginTop: 7,
            paddingHorizontal: 8,
            paddingVertical: 5,
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,.12)",
          }}
        >
          <T style={{ color: "#D3E7FB", fontSize: 10 }}>{reel.course}</T>
        </View>

        {active && finished && progress >= 1 && (
          <Press
            onPress={p.onReplay}
            style={{
              alignSelf: "flex-start",
              marginTop: 12,
              paddingHorizontal: 14,
              minHeight: 36,
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,.16)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,.25)",
              justifyContent: "center",
            }}
          >
            <T f="bb" style={{ color: "#fff", fontSize: 12 }}>
              Tekrar oynat
            </T>
          </Press>
        )}

        {/* zaman çubuğu */}
        <Pressable
          disabled={!finished}
          onLayout={(e) => {
            barW.current = e.nativeEvent.layout.width || 1;
          }}
          onPress={(e) =>
            p.onSeek(
              Math.max(0, Math.min(1, e.nativeEvent.locationX / barW.current)),
            )
          }
          style={{ height: 22, justifyContent: "center", marginTop: 8 }}
        >
          <View
            style={{
              height: 3,
              borderRadius: 8,
              backgroundColor: "rgba(255,255,255,.23)",
            }}
          >
            <View
              style={{
                width: `${(active ? progress : 0) * 100}%`,
                height: 3,
                borderRadius: 8,
                backgroundColor: C.sun,
              }}
            />
          </View>
        </Pressable>
        <T style={{ fontSize: 9, color: "#C5D9EE", marginBottom: 8 }}>
          {finished
            ? "Çubuğa dokunarak istediğin yeri tekrar izle"
            : "Zaman çubuğu ilk izlemeden sonra açılır"}
        </T>
        {!isFact && (
          <GradBtn
            label={
              finished
                ? "Soruları çöz, doğru başına +5 kredi"
                : "Video bitince sorular açılır"
            }
            onPress={p.onQuiz}
            disabled={!finished}
            colors={[C.sun, "#FFE89B"]}
            textColor={C.abyss}
            style={{ alignSelf: "stretch" }}
          />
        )}
      </View>

      <Press
        onPress={p.onBack}
        style={{
          position: "absolute",
          top: p.topInset + 10,
          left: 13,
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: "rgba(255,255,255,.14)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ArrowLeft size={19} color="#fff" />
      </Press>
    </View>
  );
}