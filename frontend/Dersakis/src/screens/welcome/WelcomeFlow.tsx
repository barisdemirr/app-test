import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Easing,
  ScrollView,
  Vibration,
  View,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, ChevronLeft } from "lucide-react-native";
import { C, G_CORAL } from "@/theme";
import { Enter, GradBtn, Press, Pulse, T } from "@/components/ui";
import { Dolphin, type DolphinMood } from "@/components/mascot";
import { finishWelcome } from "@/utils/welcome";
import {
  DEPTS,
  LEVELS,
  TRACKS,
  labelOf,
  needsDept,
  needsTrack,
  subjectsFor,
  type LevelId,
  type Option,
  type Profile,
} from "./data";

type StepKey = "welcome" | "level" | "track" | "dept" | "subjects" | "ready";

/* ------------------------------------------------------------------ arka plan */

function Bubble({ i, W, H }: { i: number; W: number; H: number }) {
  const v = useRef(new Animated.Value(0)).current;
  const size = 8 + ((i * 7) % 18);
  const left = ((i * 53) % 100) / 100;
  const dur = 7000 + ((i * 1300) % 6000);
  useEffect(() => {
    const l = Animated.loop(
      Animated.timing(v, { toValue: 1, duration: dur, delay: (i * 900) % 5000, easing: Easing.linear, useNativeDriver: true }),
    );
    l.start();
    return () => l.stop();
  }, [v, dur, i]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: left * W,
        top: 0,
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.2,
        borderColor: "rgba(255,255,255,.35)",
        backgroundColor: "rgba(255,255,255,.08)",
        opacity: v.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 0.9, 0.9, 0] }),
        transform: [
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [H + 20, -40] }) },
          { translateX: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 14, -6] }) },
        ],
      }}
    />
  );
}

/* ------------------------------------------------------------------ yunus */

type Pose = { x: number; y: number; s: number; r: number; flip: boolean };

function DolphinStage({
  pose,
  hop,
  top,
  W,
}: {
  pose: Pose;
  hop: number;
  top: number;
  W: number;
}) {
  const BASE = 150;
  const x = useRef(new Animated.Value(pose.x * W)).current;
  const y = useRef(new Animated.Value(pose.y)).current;
  const s = useRef(new Animated.Value(pose.s)).current;
  const r = useRef(new Animated.Value(pose.r)).current;
  const f = useRef(new Animated.Value(pose.flip ? -1 : 1)).current;
  const bob = useRef(new Animated.Value(0)).current;
  const [mood, setMood] = useState<DolphinMood>("smile");
  const first = useRef(true);
  const lastX = useRef(pose.x * W);
  const moodTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const joy = useCallback((ms: number) => {
    setMood("joy");
    if (moodTimer.current) clearTimeout(moodTimer.current);
    moodTimer.current = setTimeout(() => setMood("smile"), ms);
  }, []);

  useEffect(() => {
    const l = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    l.start();
    return () => {
      l.stop();
      if (moodTimer.current) clearTimeout(moodTimer.current);
    };
  }, [bob]);

  // Yeni adımda: zıplayarak (yay çizerek) yeni konuma geçer, dönerken gülümser
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    joy(1000);
    const spin = pose.x * W > lastX.current ? 16 : -16;
    lastX.current = pose.x * W;
    Animated.parallel([
      Animated.spring(x, { toValue: pose.x * W, friction: 7, tension: 55, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(y, { toValue: pose.y - 90, duration: 230, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.spring(y, { toValue: pose.y, friction: 4, tension: 90, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(r, { toValue: spin, duration: 230, useNativeDriver: true }),
        Animated.spring(r, { toValue: pose.r, friction: 5, tension: 80, useNativeDriver: true }),
      ]),
      Animated.spring(s, { toValue: pose.s, friction: 6, tension: 60, useNativeDriver: true }),
      Animated.spring(f, { toValue: pose.flip ? -1 : 1, friction: 7, tension: 70, useNativeDriver: true }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pose.x, pose.y, pose.s, pose.r, pose.flip]);

  // Seçim yapıldığında küçük sevinç zıplaması
  useEffect(() => {
    if (hop === 0) return;
    joy(700);
    Animated.sequence([
      Animated.timing(y, { toValue: pose.y - 34, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(y, { toValue: pose.y, friction: 3.5, tension: 120, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.timing(r, { toValue: pose.r - 10, duration: 140, useNativeDriver: true }),
      Animated.spring(r, { toValue: pose.r, friction: 4, tension: 120, useNativeDriver: true }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hop]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top,
        left: 0,
        width: BASE,
        zIndex: 5,
        transform: [
          { translateX: Animated.subtract(x, BASE / 2) },
          { translateY: y },
          { scale: s },
          { rotate: r.interpolate({ inputRange: [-90, 90], outputRange: ["-90deg", "90deg"] }) },
          { scaleX: f },
        ],
      }}
    >
      <Animated.View
        style={{ transform: [{ translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [3, -6] }) }] }}
      >
        <Dolphin size={BASE} mood={mood} />
      </Animated.View>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ parçalar */

/** Sayfa geçişi: ileri giderken sağdan, geri dönerken soldan kayarak gelir. */
function Page({ dir, children }: { dir: 1 | -1; children: React.ReactNode }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [v]);
  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: v,
        transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [46 * dir, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  );
}

function Heading({ title, sub }: { title: string; sub?: string }) {
  return (
    <Enter y={14} style={{ alignItems: "center", paddingHorizontal: 26, marginBottom: 18 }}>
      <T f="h" style={{ fontSize: 28, lineHeight: 33, color: "#fff", textAlign: "center", letterSpacing: -0.6 }}>
        {title}
      </T>
      {sub ? (
        <T style={{ fontSize: 14, color: "#CFE8F7", textAlign: "center", marginTop: 8, lineHeight: 20 }}>{sub}</T>
      ) : null}
    </Enter>
  );
}

function OptionCard({
  o,
  selected,
  onPress,
  delay,
  tile,
}: {
  o: Option;
  selected: boolean;
  onPress: () => void;
  delay: number;
  tile?: boolean;
}) {
  const dark = selected;
  return (
    <Enter delay={delay} y={18} style={tile ? { width: "48.2%" } : undefined}>
      <Press
        onPress={onPress}
        style={{
          borderRadius: 22,
          borderWidth: 1.5,
          borderColor: selected ? "#fff" : "rgba(255,255,255,.22)",
          backgroundColor: selected ? "#fff" : "rgba(255,255,255,.11)",
          paddingVertical: tile ? 16 : 14,
          paddingHorizontal: 16,
          flexDirection: tile ? "column" : "row",
          alignItems: "center",
          gap: tile ? 6 : 14,
          minHeight: tile ? 108 : 66,
        }}
      >
        <T style={{ fontSize: tile ? 30 : 26 }}>{o.emoji}</T>
        <View style={{ flex: tile ? undefined : 1, alignItems: tile ? "center" : "flex-start" }}>
          <T f="bb" style={{ fontSize: 15, color: dark ? C.abyss : "#fff", textAlign: tile ? "center" : "left" }}>
            {o.label}
          </T>
          {o.hint ? (
            <T style={{ fontSize: 11.5, marginTop: 2, color: dark ? C.muted : "#BFE0F3", textAlign: tile ? "center" : "left" }}>
              {o.hint}
            </T>
          ) : null}
        </View>
        {selected && (
          <View
            style={{
              position: tile ? "absolute" : "relative",
              top: tile ? 9 : undefined,
              right: tile ? 9 : undefined,
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: C.tide,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Check size={13} color="#fff" strokeWidth={3} />
          </View>
        )}
      </Press>
    </Enter>
  );
}

function SubjectChip({
  label,
  selected,
  onPress,
  delay,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  delay: number;
}) {
  return (
    <Enter delay={delay} y={12}>
      <Press
        onPress={onPress}
        scaleTo={0.93}
        style={{
          minHeight: 44,
          paddingHorizontal: 16,
          borderRadius: 999,
          borderWidth: 1.5,
          borderColor: selected ? "#fff" : "rgba(255,255,255,.28)",
          backgroundColor: selected ? "#fff" : "rgba(255,255,255,.1)",
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        }}
      >
        {selected && <Check size={14} color={C.tide} strokeWidth={3} />}
        <T f="bs" style={{ fontSize: 13.5, color: selected ? C.abyss : "#fff" }}>
          {label}
        </T>
      </Press>
    </Enter>
  );
}

/* ------------------------------------------------------------------ akış */

export function WelcomeFlow({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();
  const compact = H < 700;

  const [profile, setProfile] = useState<Profile>({ level: null, track: null, dept: null });
  const [picked, setPicked] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const [hop, setHop] = useState(0);
  const dir = useRef<1 | -1>(1);
  const lock = useRef(false);

  const steps = useMemo<StepKey[]>(
    () => [
      "welcome",
      "level",
      ...(needsTrack(profile.level) ? (["track"] as StepKey[]) : []),
      ...(needsDept(profile.level) ? (["dept"] as StepKey[]) : []),
      "subjects",
      "ready",
    ],
    [profile.level],
  );
  const step = steps[Math.min(idx, steps.length - 1)];
  const subjects = useMemo(() => subjectsFor(profile), [profile]);

  const next = useCallback(() => {
    dir.current = 1;
    setIdx((i) => Math.min(i + 1, steps.length - 1));
  }, [steps.length]);
  const back = useCallback(() => {
    dir.current = -1;
    setIdx((i) => Math.max(i - 1, 0));
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (idx > 0) {
        back();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [idx, back]);

  // Seçimden sonra kısa bir "tık" hissi, ardından otomatik sonraki sayfa (kullanıcı ayrıca butona basmaz)
  const choose = (apply: () => void) => {
    if (lock.current) return;
    lock.current = true;
    Vibration.vibrate(8);
    apply();
    setHop((h) => h + 1);
    setTimeout(() => {
      next();
      lock.current = false;
    }, 320);
  };

  const pickLevel = (id: string) =>
    choose(() => {
      setProfile({ level: id as LevelId, track: null, dept: null });
      setPicked([]);
    });
  const pickTrack = (id: string) => choose(() => setProfile((p) => ({ ...p, track: id })));
  const pickDept = (id: string) =>
    choose(() => {
      setProfile((p) => ({ ...p, dept: id }));
      setPicked([]);
    });

  const toggleSubject = (label: string) => {
    Vibration.vibrate(6);
    setHop((h) => h + 1);
    setPicked((s) => (s.includes(label) ? s.filter((x) => x !== label) : [...s, label]));
  };

  const finish = async () => {
    const keys = Array.from(
      new Set(subjects.filter((s) => picked.includes(s.label) && s.key).map((s) => s.key)),
    );
    await finishWelcome({
      level: profile.level,
      track: profile.track,
      dept: profile.dept,
      keys,
      labels: picked,
    });
    onDone();
  };

  // Her adımda yunus başka bir köşeye geçer
  const big = step === "welcome" || step === "ready";
  const POSES: Record<StepKey, Pose> = {
    welcome: { x: 0.5, y: 34, s: compact ? 1.25 : 1.55, r: 0, flip: false },
    level: { x: 0.8, y: 0, s: 0.72, r: -8, flip: false },
    track: { x: 0.2, y: 0, s: 0.72, r: 8, flip: true },
    dept: { x: 0.8, y: 0, s: 0.72, r: -6, flip: false },
    subjects: { x: 0.22, y: 0, s: 0.72, r: 6, flip: true },
    ready: { x: 0.5, y: 24, s: compact ? 1.3 : 1.65, r: 0, flip: false },
  };
  const zoneTop = insets.top + 46;
  const contentTop = zoneTop + (big ? (compact ? 200 : 255) : compact ? 100 : 128);
  const footerH = 84 + insets.bottom;
  const progress = Math.max(0, idx - 0) / Math.max(1, steps.length - 1);
  const prog = useRef(new Animated.Value(progress)).current;
  useEffect(() => {
    Animated.timing(prog, { toValue: progress, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [progress, prog]);

  const cta =
    step === "welcome"
      ? { label: "Başlayalım", onPress: next, disabled: false }
      : step === "subjects"
        ? {
            label: picked.length ? `Devam et · ${picked.length} ders` : "En az bir ders seç",
            onPress: next,
            disabled: picked.length === 0,
          }
        : step === "ready"
          ? { label: "Giriş yap / Kayıt ol", onPress: finish, disabled: false }
          : null;

  const summary = [
    labelOf(LEVELS, profile.level),
    profile.level === "lise" ? labelOf(TRACKS, profile.track) : "",
    needsDept(profile.level) ? labelOf(DEPTS, profile.dept) : "",
  ].filter(Boolean);

  return (
    <View style={{ flex: 1, backgroundColor: C.abyss }}>
      <LinearGradient
        colors={[C.abyss, C.deep, "#1B7FB5"]}
        locations={[0, 0.55, 1]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {Array.from({ length: 9 }).map((_, i) => (
        <Bubble key={i} i={i} W={W} H={H} />
      ))}

      {/* üst bar: geri + ilerleme */}
      <View
        style={{
          position: "absolute",
          top: insets.top + 8,
          left: 16,
          right: 16,
          height: 36,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          zIndex: 10,
        }}
      >
        <Press
          onPress={back}
          disabled={idx === 0}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "rgba(255,255,255,.14)",
            alignItems: "center",
            justifyContent: "center",
            opacity: idx === 0 ? 0 : 1,
          }}
        >
          <ChevronLeft size={20} color="#fff" />
        </Press>
        <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,.16)", overflow: "hidden" }}>
          <Animated.View
            style={{
              height: 6,
              borderRadius: 3,
              backgroundColor: "#FFD66B",
              width: prog.interpolate({ inputRange: [0, 1], outputRange: ["6%", "100%"] }),
            }}
          />
        </View>
        <T f="bb" style={{ fontSize: 12, color: "#CFE8F7", width: 34, textAlign: "right" }}>
          {idx + 1}/{steps.length}
        </T>
      </View>

      <DolphinStage pose={POSES[step]} hop={hop} top={zoneTop} W={W} />

      <View style={{ flex: 1, paddingTop: contentTop, paddingBottom: cta ? footerH : insets.bottom + 12 }}>
        <Page key={step} dir={dir.current}>
          {step === "welcome" && (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "flex-start" }}>
              <Heading
                title="Dolphora'ya hoş geldin!"
                sub="Ben Dolphy. Bilgiye birlikte dalalım: kısa videolar, canlı dersler ve bilene sor, hepsi burada."
              />
              <View style={{ gap: 10, alignSelf: "stretch", paddingHorizontal: 28, marginTop: 6 }}>
                {[
                  ["🎬", "Kısa videolarla öğren, krediyi kap"],
                  ["🎙️", "Canlı ders ve sesli görüşmelere katıl"],
                  ["💬", "Takıldığını bilene sor"],
                ].map(([e, t], i) => (
                  <Enter key={t} delay={350 + i * 120} y={14}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11, paddingHorizontal: 16, borderRadius: 18, backgroundColor: "rgba(255,255,255,.1)", borderWidth: 1, borderColor: "rgba(255,255,255,.2)" }}>
                      <T style={{ fontSize: 20 }}>{e}</T>
                      <T f="bs" style={{ color: "#fff", fontSize: 13.5, flex: 1 }}>{t}</T>
                    </View>
                  </Enter>
                ))}
              </View>
            </View>
          )}

          {step === "level" && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
              <Heading title="Akademik seviyen nedir?" sub="Sana uygun dersleri hazırlayalım." />
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                {LEVELS.map((o, i) => (
                  <OptionCard key={o.id} o={o} tile delay={i * 55} selected={profile.level === o.id} onPress={() => pickLevel(o.id)} />
                ))}
              </View>
            </ScrollView>
          )}

          {step === "track" && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
              <Heading title="Hangi alandasın?" sub="Lisede hangi alanı okuyorsun ya da düşünüyorsun?" />
              <View style={{ gap: 11 }}>
                {TRACKS.map((o, i) => (
                  <OptionCard key={o.id} o={o} delay={i * 60} selected={profile.track === o.id} onPress={() => pickTrack(o.id)} />
                ))}
              </View>
            </ScrollView>
          )}

          {step === "dept" && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
              <Heading title="Bölümün ne?" sub="Sana en yakın olanı seç." />
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 11 }}>
                {DEPTS.map((o, i) => (
                  <OptionCard key={o.id} o={o} tile delay={i * 40} selected={profile.dept === o.id} onPress={() => pickDept(o.id)} />
                ))}
              </View>
            </ScrollView>
          )}

          {step === "subjects" && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
              <Heading title="Hangi derslerle ilgileniyorsun?" sub="Birkaçını seç, akışını ona göre kuralım. Sonradan değiştirebilirsin." />
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
                {subjects.map((s, i) => (
                  <SubjectChip key={s.label} label={s.label} delay={i * 35} selected={picked.includes(s.label)} onPress={() => toggleSubject(s.label)} />
                ))}
              </View>
              <Press onPress={() => { setPicked([]); next(); }} style={{ alignSelf: "center", padding: 16 }}>
                <T f="bs" style={{ color: "#BFE0F3", fontSize: 13 }}>Şimdilik geç</T>
              </Press>
            </ScrollView>
          )}

          {step === "ready" && (
            <View style={{ flex: 1, alignItems: "center" }}>
              <Heading title="Harika, hazırsın!" sub="Şimdi hesabına giriş yap ya da yeni bir hesap oluştur. Akışın seçtiklerine göre hazır." />
              <Enter delay={250} style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, paddingHorizontal: 24 }}>
                {[...summary, picked.length ? `${picked.length} ders` : ""].filter(Boolean).map((t) => (
                  <View
                    key={t}
                    style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: "rgba(255,255,255,.14)", borderWidth: 1, borderColor: "rgba(255,255,255,.25)" }}
                  >
                    <T f="bs" style={{ color: "#fff", fontSize: 12.5 }}>{t}</T>
                  </View>
                ))}
              </Enter>
            </View>
          )}
        </Page>
      </View>

      {cta && (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: insets.bottom + 16,
          }}
        >
          <Pulse to={1.03} duration={step === "welcome" || step === "ready" ? 900 : 1200} active={!cta.disabled}>
            <GradBtn label={cta.label} colors={G_CORAL} onPress={cta.onPress} disabled={cta.disabled} style={{ minHeight: 54 }} />
          </Pulse>
        </View>
      )}
    </View>
  );
}
