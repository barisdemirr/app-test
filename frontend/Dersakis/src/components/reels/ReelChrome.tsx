import React, { useRef } from "react";
import { PanResponder, Pressable, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Play,
  Share2,
} from "lucide-react-native";
import { C, DIAG } from "@/theme";
import { Avatar, GradBtn, GridBg, Press, T } from "@/components/ui";

export type ReelChromeProps = {
  width: number;
  height: number;
  topInset: number;
  bottomOffset: number;

  title: string;
  courseName: string;
  creatorName: string;
  creatorInitials: string;
  creatorColor: string;
  creatorAvatarUrl: string | null;

  saved: boolean;
  learned: boolean;
  /** 0..1 */
  progress: number;
  /** Duraklatıldı göstergesini göster */
  paused: boolean;
  /** İlk izleme tamamlandı: ileri sarma ve quiz açılır */
  unlocked: boolean;
  /** Bitti, "Tekrar oynat" göster */
  ended: boolean;
  /** Quiz düğmesi: null = gizle */
  quizLabel: string | null;

  /** Video katmanı (arka plan) */
  children?: React.ReactNode;

  onTogglePlay: () => void;
  onLearn: () => void;
  onSave: () => void;
  onShare: () => void;
  onQuiz: () => void;
  onReplay: () => void;
  onSeek: (p: number) => void;
  onBack: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
};

/** Reel'in sunum katmanı: yalnızca props ile çizer, sunucuya/oynatıcıya dokunmaz. */
export function ReelChrome(p: ReelChromeProps) {
  const barW = useRef(1);
  const lastX = useRef(0);
  const live = useRef(p);
  live.current = p;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => live.current.unlocked,
      onMoveShouldSetPanResponder: () => live.current.unlocked,
      onPanResponderGrant: (e) => {
        if (!live.current.unlocked) return;
        live.current.onDragStart?.();
        const x = Math.max(0, Math.min(1, e.nativeEvent.locationX / barW.current));
        lastX.current = x;
        live.current.onSeek(x);
      },
      onPanResponderMove: (_e, g) => {
        if (!live.current.unlocked) return;
        const next = Math.max(0, Math.min(1, lastX.current + g.dx / barW.current));
        live.current.onSeek(next);
      },
      onPanResponderRelease: () => live.current.onDragEnd?.(),
      onPanResponderTerminate: () => live.current.onDragEnd?.(),
    }),
  ).current;

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

  const pct = Math.max(0, Math.min(1, p.progress));

  return (
    <View style={{ width: p.width, height: p.height, overflow: "hidden" }}>
      <LinearGradient
        colors={[C.abyss, C.deep, "#164B83"]}
        {...DIAG}
        style={StyleSheet.absoluteFill}
      />
      <GridBg />

      {/* video */}
      {p.children}

      {/* oynat / duraklat: tüm kart */}
      <Pressable style={StyleSheet.absoluteFill} onPress={p.onTogglePlay} />

      {/* duraklatıldı göstergesi */}
      {p.paused && (
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

      {/* ders etiketi */}
      <View
        pointerEvents="none"
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
      >
        <T f="bs" style={{ color: "#fff", fontSize: 11 }}>
          {p.courseName}
        </T>
      </View>

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
            <T style={{ color: a.on ? C.sun : "#fff", fontSize: 9 }}>{a.label}</T>
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
          pointerEvents="none"
          style={{
            position: "absolute",
            left: -18,
            right: -18,
            top: -40,
            bottom: -8,
          }}
        />
        <View
          pointerEvents="none"
          style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingRight: 70 }}
        >
          <Avatar
            initials={p.creatorInitials}
            color={p.creatorColor}
            uri={p.creatorAvatarUrl}
            size={32}
          />
          <T f="bb" style={{ color: "#fff", fontSize: 12 }}>
            {p.creatorName}
          </T>
        </View>
        <T
          f="bb"
          pointerEvents="none"
          style={{ color: "#fff", fontSize: 15, lineHeight: 19, marginTop: 8, paddingRight: 70 }}
        >
          {p.title}
        </T>

        {p.ended && (
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
        <View
          {...(p.unlocked ? pan.panHandlers : {})}
          onLayout={(e) => {
            barW.current = e.nativeEvent.layout.width || 1;
          }}
          style={{
            height: 30,
            justifyContent: "center",
            marginTop: 8,
            opacity: p.unlocked ? 1 : 0.55,
          }}
        >
          <View
            style={{
              height: 3,
              borderRadius: 8,
              backgroundColor: p.unlocked ? "rgba(255,255,255,.23)" : "rgba(255,255,255,.14)",
            }}
          >
            <View
              style={{
                width: `${pct * 100}%`,
                height: 3,
                borderRadius: 8,
                backgroundColor: p.unlocked ? C.sun : "#8B9BB4",
              }}
            />
          </View>
          {p.unlocked && (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: `${pct * 100}%`,
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: C.sun,
                borderWidth: 2,
                borderColor: "#fff",
                marginLeft: -9,
                elevation: 3,
              }}
            />
          )}
        </View>

        <T style={{ fontSize: 9, color: p.unlocked ? "#C5D9EE" : "#8B9BB4", marginBottom: 8 }}>
          {p.unlocked
            ? "Çubuğu sürükleyerek istediğin yere atla"
            : "🔒 Zaman çubuğu ilk izlemeden sonra açılır"}
        </T>

        {p.quizLabel && (
          <GradBtn
            label={p.quizLabel}
            onPress={p.onQuiz}
            disabled={!p.unlocked}
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
