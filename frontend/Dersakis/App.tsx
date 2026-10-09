import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  PressableProps,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextProps,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Svg, { Defs, Path, Pattern, Rect } from "react-native-svg";
import { useFonts } from "expo-font";
import {
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
} from "@expo-google-fonts/bricolage-grotesque";
import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  InstrumentSans_700Bold,
} from "@expo-google-fonts/instrument-sans";
import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  ChevronDown,
  Crown,
  Flame,
  Gem,
  Home,
  Play,
  PlayCircle,
  Plus,
  Search,
  Send,
  Share2,
  Sparkles,
  Upload,
  UserRound,
  Volume2,
  X,
} from "lucide-react-native";

/* ------------------------------------------------------------------ */
/* THEME                                                               */
/* ------------------------------------------------------------------ */
const C = {
  abyss: "#061A3A",
  deep: "#0A2A66",
  tide: "#1B6BFF",
  lagoon: "#19C3D6",
  foam: "#F2F8FF",
  mist: "#DCEAF7",
  pearl: "#FFFFFF",
  coral: "#FF7A5C",
  coral2: "#FF9D68",
  sun: "#FFD66B",
  muted: "#5B6B85",
  success: "#1C8C5E",
  error: "#C8372D",
  ink: "#10213E",
};

// Yunus yüzgeci (fin) köşe yapısı: CSS "28px 10px 28px 10px"
const fin: ViewStyle = {
  borderTopLeftRadius: 28,
  borderTopRightRadius: 10,
  borderBottomRightRadius: 28,
  borderBottomLeftRadius: 10,
};

const shadow = (
  opacity: number,
  radius: number,
  y: number,
  color = C.abyss,
): ViewStyle => ({
  shadowColor: color,
  shadowOpacity: opacity,
  shadowRadius: radius,
  shadowOffset: { width: 0, height: y },
  elevation: Math.max(1, Math.round(radius / 2)),
});
const SH = {
  card: shadow(0.1, 14, 8, C.deep),
  soft: shadow(0.08, 9, 4),
  float: shadow(0.2, 18, 10),
};

const FONT = {
  h: "BricolageGrotesque_700Bold",
  hm: "BricolageGrotesque_600SemiBold",
  b: "InstrumentSans_400Regular",
  bm: "InstrumentSans_500Medium",
  bs: "InstrumentSans_600SemiBold",
  bb: "InstrumentSans_700Bold",
} as const;
type FontKey = keyof typeof FONT;

const DIAG = { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } };
const HORZ = { start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } };
type G2 = readonly [string, string];
const G_PRIMARY: G2 = [C.tide, C.lagoon];
const G_CORAL: G2 = [C.coral, C.coral2];

/* ------------------------------------------------------------------ */
/* DATA                                                                */
/* ------------------------------------------------------------------ */
const courses = [
  "Matematik 1",
  "Fizik 1",
  "Genel Kimya",
  "Anatomi",
  "Hücre Biyolojisi",
];
const interestsList = [
  "Matematik",
  "Fizik",
  "Kimya",
  "Tıp",
  "Tarih",
  "Spor",
  "Uzay",
];

type Lesson = {
  title: string;
  desc: string;
  course: string;
  teacher: string;
  role: string;
  initials: string;
  color: string;
  time: string;
};
const lessons: Lesson[] = [
  {
    title: "Limit ve süreklilik: sıfırdan ustalığa",
    desc: "Limit fikrini sezgisel bir yoldan keşfet, en sık çıkan soru tiplerini birlikte çözelim.",
    course: "Matematik 1",
    teacher: "Elif Yıldız",
    role: "Matematik asistanı",
    initials: "EY",
    color: "#7276F4",
    time: "3 dk",
  },
  {
    title: "Zincir ve çarpım kuralı",
    desc: "Karmaşık türevleri küçük parçalara ayırıp pratik bir yöntemle çöz.",
    course: "Matematik 1",
    teacher: "Can Demir",
    role: "Analiz dersi eğitmeni",
    initials: "CD",
    color: "#26B6C4",
    time: "4 dk",
  },
  {
    title: "Sabit ivmeli hareket",
    desc: "Konum, hız ve ivme arasındaki bağı kısa örneklerle kavra.",
    course: "Fizik 1",
    teacher: "Mert Aksoy",
    role: "Fizik asistanı",
    initials: "MA",
    color: "#F29C72",
    time: "3 dk",
  },
  {
    title: "Mol kavramı ve pH",
    desc: "Çözeltilerde miktar hesabını kolaylaştıran kısa bir kimya turu.",
    course: "Genel Kimya",
    teacher: "Zeynep Arslan",
    role: "Kimya asistanı",
    initials: "ZA",
    color: "#59B890",
    time: "5 dk",
  },
  {
    title: "Kalp kapakçıkları ve koroner dolaşım",
    desc: "Kalbin içindeki yolculuğu basit ve akılda kalıcı bir haritayla öğren.",
    course: "Anatomi",
    teacher: "Dr. Selin Kaya",
    role: "Tıp fakültesi öğretim görevlisi",
    initials: "SK",
    color: "#C277AB",
    time: "6 dk",
  },
  {
    title: "ATP ve DNA baz eşleşmesi",
    desc: "Hücre enerjisi ve genetik kodun temel taşlarını keşfet.",
    course: "Hücre Biyolojisi",
    teacher: "Dr. Selin Kaya",
    role: "Tıp fakültesi öğretim görevlisi",
    initials: "SK",
    color: "#477CC6",
    time: "4 dk",
  },
];

type Question = {
  name: string;
  initials: string;
  color: string;
  course: string;
  topic: string;
  text: string;
  answers: string[];
};
const initialQuestions: Question[] = [
  {
    name: "Ada",
    initials: "AY",
    color: "#8B8CF8",
    course: "Matematik 1",
    topic: "Limit",
    text: "L'Hôpital kuralını hangi durumlarda kullanabilirim?",
    answers: [
      "Belirsiz biçimler oluştuğunda ve koşullar sağlandığında kullanabilirsin.",
      "Önce 0/0 ya da ∞/∞ biçiminde olduğunu kontrol et.",
    ],
  },
  {
    name: "Selin",
    initials: "SK",
    color: "#DD8BB6",
    course: "Fizik 1",
    topic: "Çarpışma",
    text: "Esnek ve esnek olmayan çarpışmada hangi büyüklükler korunur?",
    answers: [
      "Her iki durumda momentum korunur; esnek çarpışmada kinetik enerji de korunur.",
    ],
  },
  {
    name: "Zehra",
    initials: "ZA",
    color: "#5AB996",
    course: "Genel Kimya",
    topic: "Asit-baz",
    text: "Zayıf asit çözeltisinin pH değerini nasıl hesaplarım?",
    answers: ["Ka ve başlangıç derişimiyle denge tablosu kurabilirsin."],
  },
  {
    name: "Naz",
    initials: "NK",
    color: "#F09875",
    course: "Anatomi",
    topic: "Dolaşım",
    text: "Kalpte kanın akış sırası nedir?",
    answers: [
      "Sağ kulakçık, sağ karıncık, akciğerler, sol kulakçık ve sol karıncık.",
    ],
  },
  {
    name: "Ayşe",
    initials: "AK",
    color: "#55A2CE",
    course: "Hücre Biyolojisi",
    topic: "Hücre bölünmesi",
    text: "Mitoz ile mayoz arasındaki fark nedir?",
    answers: [
      "Mitoz iki, mayoz dört hücre oluşturur; genetik çeşitlilik mayozda artar.",
    ],
  },
  {
    name: "Eren",
    initials: "ED",
    color: "#A289D6",
    course: "Matematik 1",
    topic: "Seriler",
    text: "Bir serinin yakınsadığını nasıl anlarım?",
    answers: [],
  },
];

type Quiz = { q: string; correct: string; wrong: string[]; exp: string };
type Reel = {
  id: string;
  course: string;
  creator: string;
  initials: string;
  color: string;
  title: string;
  lines: string[];
  result: string;
  quiz: Quiz[];
};
const FACT = "Biliyor muydun?";
const initialReels: Reel[] = [
  {
    id: "r1",
    course: "Matematik 1",
    creator: "Elif Yıldız",
    initials: "EY",
    color: "#8589F9",
    title: "sin(x)/x limiti ve sonsuzda limit",
    lines: ["lim sin(3x) / x", "x → 0", "= 3 · lim sin(3x) / (3x)", "= 3"],
    result: "= 3",
    quiz: [
      {
        q: "x→0 için sin(3x)/x limiti kaçtır?",
        correct: "3",
        wrong: ["0", "1", "Limit yok"],
        exp: "sin(u)/u, u→0 iken 1’e gider. sin(3x)/x = 3·sin(3x)/(3x) olduğundan sonuç 3 olur.",
      },
      {
        q: "x→∞ için (3x²+2x)/(x²−1) limiti kaçtır?",
        correct: "3",
        wrong: ["2", "∞", "0"],
        exp: "En yüksek dereceli terimlerin katsayıları oranlanır: 3/1 = 3.",
      },
    ],
  },
  {
    id: "r2",
    course: "Fizik 1",
    creator: "Mert Aksoy",
    initials: "MA",
    color: "#F29C72",
    title: "İvme sabitse hareket nasıl değişir?",
    lines: [
      "v = v₀ + at",
      "x = x₀ + v₀t + ½at²",
      "İvme hızın değişimidir.",
      "a = Δv / Δt",
    ],
    result: "a = Δv / Δt",
    quiz: [
      {
        q: "20 m/s hızla giden araç 5 m/s² sabit yavaşlamayla durana kadar kaç metre gider?",
        correct: "40 m",
        wrong: ["20 m", "80 m", "4 m"],
        exp: "0 = 400 − 2·5·x, buradan x = 40 m.",
      },
      {
        q: "45 m yükseklikten serbest bırakılan cisim kaç saniyede yere düşer? (g=10 m/s²)",
        correct: "3 s",
        wrong: ["4,5 s", "9 s", "2 s"],
        exp: "45 = ½·10·t², t² = 9, t = 3 s.",
      },
    ],
  },
  {
    id: "r3",
    course: "Genel Kimya",
    creator: "Zeynep Arslan",
    initials: "ZA",
    color: "#59B890",
    title: "pH ölçeğini 20 saniyede hatırla",
    lines: ["pH = −log[H⁺]", "[H⁺] artarsa…", "pH azalır", "Asitlik artar"],
    result: "pH azalır",
    quiz: [
      {
        q: "0,01 M HCl çözeltisinin pH değeri kaçtır?",
        correct: "2",
        wrong: ["1", "12", "7"],
        exp: "HCl güçlü asittir, [H⁺] = 10⁻² M ve pH = 2.",
      },
      {
        q: "0,001 M NaOH çözeltisinin 25 °C’deki pH değeri kaçtır?",
        correct: "11",
        wrong: ["3", "10", "14"],
        exp: "pOH = 3 ve pH = 14 − 3 = 11.",
      },
    ],
  },
  {
    id: "r4",
    course: "Anatomi",
    creator: "Dr. Selin Kaya",
    initials: "SK",
    color: "#C277AB",
    title: "Kalpte kanın izlediği yol",
    lines: [
      "Vücut → sağ kulakçık",
      "→ sağ karıncık",
      "→ akciğerler → sol kulakçık",
      "→ vücut",
    ],
    result: "→ vücut",
    quiz: [
      {
        q: "Sol atriyum ile sol ventrikül arasındaki kapak hangisidir?",
        correct: "Mitral kapak",
        wrong: ["Triküspit kapak", "Aort kapağı", "Pulmoner kapak"],
        exp: "Mitral (bikuspit) kapak sol atriyum ile sol ventrikül arasındadır. Eğitim amaçlıdır, tıbbi tavsiye değildir.",
      },
      {
        q: "Koroner arterler hangi damardan çıkar?",
        correct: "Aorta",
        wrong: ["Pulmoner arter", "Vena cava superior", "Pulmoner ven"],
        exp: "Koroner arterler çıkan aortanın kök kısmından başlar.",
      },
    ],
  },
  {
    id: "r5",
    course: FACT,
    creator: "Dersakış",
    initials: "D",
    color: "#44BDD0",
    title: "Işık boşlukta saniyede yaklaşık 300.000 km yol alır.",
    lines: [],
    result: "",
    quiz: [],
  },
  {
    id: "r6",
    course: "Matematik 1",
    creator: "Can Demir",
    initials: "CD",
    color: "#26B6C4",
    title: "Zincir kuralının kısa yolu",
    lines: [
      "y = f(g(x))",
      "Önce dışın türevi",
      "sonra iç fonksiyonun türevi",
      "y′ = f′(g(x)) · g′(x)",
    ],
    result: "y′ = f′(g(x)) · g′(x)",
    quiz: [
      {
        q: "d/dx sin(x²) neye eşittir?",
        correct: "2x·cos(x²)",
        wrong: ["cos(x²)", "2x·sin(x²)", "−2x·cos(x²)"],
        exp: "Zincir kuralı: dış fonksiyonun türevi çarpı iç fonksiyonun türevi.",
      },
      {
        q: "d/dx (x·eˣ) neye eşittir?",
        correct: "eˣ(1+x)",
        wrong: ["x·eˣ", "eˣ", "eˣ + x"],
        exp: "Çarpım kuralı: (x)′·eˣ + x·(eˣ)′ = eˣ + x·eˣ.",
      },
    ],
  },
];

type RewardIcon =
  | "book"
  | "mentor"
  | "spark"
  | "exam"
  | "cards"
  | "coffee"
  | "crown";
const rewardsData: {
  name: string;
  source: string;
  price: number;
  icon: RewardIcon;
  featured?: boolean;
}[] = [
  {
    name: "Kalkülüs soru bankası (PDF)",
    source: "Dersakış özel içeriği",
    price: 80,
    icon: "book",
  },
  {
    name: "Mentörle 15 dk soru-cevap",
    source: "Eğitmen ayrıcalığı",
    price: 150,
    icon: "mentor",
    featured: true,
  },
  {
    name: "Fizik 1 formül kitapçığı",
    source: "Dersakış özel içeriği",
    price: 70,
    icon: "spark",
  },
  {
    name: "Online sınav provası",
    source: "Sınav hazırlık",
    price: 120,
    icon: "exam",
  },
  {
    name: "Dijital flashcard seti",
    source: "Hızlı tekrar",
    price: 60,
    icon: "cards",
  },
  {
    name: "Kitap kafe indirimi %15",
    source: "Öğrenci ayrıcalığı",
    price: 60,
    icon: "coffee",
  },
  {
    name: "Reklamsız 1 hafta",
    source: "Dersakış üyeliği",
    price: 50,
    icon: "crown",
  },
];

const DAILY_CAP = 60;

type QForm = { q: string; correct: string; wrong: string[]; exp: string };
const emptyQ = (): QForm => ({
  q: "",
  correct: "",
  wrong: ["", "", ""],
  exp: "",
});

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* ------------------------------------------------------------------ */
/* PRIMITIVES                                                          */
/* ------------------------------------------------------------------ */
function T({ f = "b", style, ...p }: TextProps & { f?: FontKey }) {
  return (
    <Text
      {...p}
      style={[{ fontFamily: FONT[f], color: C.ink, fontSize: 14 }, style]}
    />
  );
}

type PressProps = Omit<PressableProps, "style" | "children"> & {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};
function Press({ style, children, disabled, ...rest }: PressProps) {
  return (
    <Pressable
      disabled={disabled}
      {...rest}
      style={({ pressed }) => [
        style,
        pressed && !disabled && { transform: [{ scale: 0.97 }], opacity: 0.92 },
      ]}
    >
      {children}
    </Pressable>
  );
}

function Avatar({
  initials,
  color,
  size = 40,
}: {
  initials: string;
  color: string;
  size?: number;
}) {
  return (
    <LinearGradient
      colors={[color, C.deep]}
      {...DIAG}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,.25)",
      }}
    >
      <T f="bb" style={{ color: "#fff", fontSize: size * 0.32 }}>
        {initials}
      </T>
    </LinearGradient>
  );
}

// Yunusun sonar (ekolokasyon) halkaları
function Sonar({
  size = 138,
  color = "rgba(255,255,255,.18)",
}: {
  size?: number;
  color?: string;
}) {
  const ring = (s: number) => (
    <View
      key={s}
      style={{
        position: "absolute",
        width: s,
        height: s,
        borderRadius: s / 2,
        borderWidth: 1.5,
        borderColor: color,
      }}
    />
  );
  return (
    <View
      pointerEvents="none"
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {ring(size)}
      {ring(size * 0.76)}
      {ring(size * 0.52)}
    </View>
  );
}

function Chip({
  children,
  active = false,
  onPress,
}: {
  children: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Press
      onPress={onPress}
      style={{
        minHeight: 40,
        paddingHorizontal: 14,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? C.tide : C.mist,
        backgroundColor: "#fff",
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {active && (
        <LinearGradient
          colors={G_PRIMARY}
          {...DIAG}
          style={StyleSheet.absoluteFill}
        />
      )}
      <T f="bs" style={{ fontSize: 12, color: active ? "#fff" : C.muted }}>
        {children}
      </T>
    </Press>
  );
}

function MiniPill({
  label,
  color = C.muted,
  bg = C.foam,
}: {
  label: string;
  color?: string;
  bg?: string;
}) {
  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 5,
      }}
    >
      <T style={{ fontSize: 10, color }}>{label}</T>
    </View>
  );
}

function GradBtn({
  label,
  onPress,
  colors = G_CORAL,
  textColor = "#fff",
  disabled,
  style,
  radius = fin,
  small,
  icon,
}: {
  label: string;
  onPress?: () => void;
  colors?: G2;
  textColor?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  radius?: ViewStyle;
  small?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <Press
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          minHeight: small ? 40 : 48,
          overflow: "hidden",
          justifyContent: "center",
        },
        radius,
        style,
      ]}
    >
      <LinearGradient
        colors={disabled ? (["#C3CFDD", "#C3CFDD"] as G2) : colors}
        {...HORZ}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={{
          paddingHorizontal: small ? 14 : 18,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        {icon}
        <T
          f="bb"
          style={{
            color: disabled ? "#8596AB" : textColor,
            fontSize: small ? 12 : 14,
          }}
        >
          {label}
        </T>
      </View>
    </Press>
  );
}

function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 24,
        marginBottom: 13,
      }}
    >
      <T f="h" style={{ fontSize: 19 }}>
        {title}
      </T>
      {action ? (
        <Press onPress={onAction} style={{ padding: 8 }}>
          <T f="bb" style={{ color: C.tide, fontSize: 12 }}>
            {action}
          </T>
        </Press>
      ) : null}
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  maxLength,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? (
        <T f="bb" style={{ fontSize: 12, color: C.muted, marginBottom: 7 }}>
          {label}
        </T>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9AA9BD"
        maxLength={maxLength}
        multiline={multiline}
        style={{
          fontFamily: FONT.b,
          fontSize: 14,
          color: C.ink,
          backgroundColor: "#fff",
          borderWidth: 1.5,
          borderColor: C.mist,
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingTop: multiline ? 12 : 0,
          paddingBottom: multiline ? 12 : 0,
          height: multiline ? undefined : 48,
          minHeight: multiline ? 78 : undefined,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </View>
  );
}

function Toast({ text, bottom }: { text: string; bottom: number }) {
  if (!text) return null;
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 40,
        right: 40,
        bottom,
        alignItems: "center",
        zIndex: 50,
      }}
    >
      <View
        style={[
          {
            minHeight: 40,
            paddingHorizontal: 16,
            borderRadius: 999,
            backgroundColor: C.abyss,
            alignItems: "center",
            justifyContent: "center",
          },
          SH.float,
        ]}
      >
        <T f="bs" style={{ color: "#fff", fontSize: 12 }}>
          {text}
        </T>
      </View>
    </View>
  );
}

function Sheet({
  children,
  onClose,
  toast,
}: {
  children: React.ReactNode;
  onClose: () => void;
  toast: string;
}) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const y = useRef(new Animated.Value(500)).current;
  useEffect(() => {
    Animated.spring(y, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
      speed: 16,
    }).start();
  }, [y]);
  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(3,15,39,.54)" },
          ]}
          onPress={onClose}
        />
        <KeyboardAvoidingView behavior="padding">
          <Animated.View
            style={[
              {
                maxHeight: height * 0.86,
                backgroundColor: C.foam,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                transform: [{ translateY: y }],
              },
              shadow(0.2, 24, -10),
            ]}
          >
            <View
              style={{
                width: 42,
                height: 4,
                borderRadius: 4,
                backgroundColor: "#B7C7D9",
                alignSelf: "center",
                marginTop: 10,
                marginBottom: 6,
              }}
            />
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: 10,
                paddingBottom: insets.bottom + 24,
              }}
            >
              {children}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
        <Toast text={toast} bottom={insets.bottom + 40} />
      </View>
    </Modal>
  );
}

// Reels arka planındaki ızgara (kareli defter hissi)
const GridBg = React.memo(function GridBg() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <Pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <Path
            d="M24 0H0V24"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
            fill="none"
          />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#grid)" />
    </Svg>
  );
});

function FadeLine({
  on,
  highlight,
  text,
}: {
  on: boolean;
  highlight: boolean;
  text: string;
}) {
  const v = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: on ? 1 : 0,
      duration: 380,
      useNativeDriver: true,
    }).start();
  }, [on, v]);
  const opacity = v.interpolate({ inputRange: [0, 1], outputRange: [0.12, 1] });
  const translateY = v.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });
  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
        marginBottom: 12,
        alignSelf: "flex-start",
      }}
    >
      {highlight ? (
        <View
          style={{
            backgroundColor: C.sun,
            borderRadius: 12,
            paddingHorizontal: 10,
            paddingVertical: 5,
          }}
        >
          <T f="hm" style={{ fontSize: 24, lineHeight: 30, color: C.abyss }}>
            {text}
          </T>
        </View>
      ) : (
        <T f="hm" style={{ fontSize: 24, lineHeight: 30, color: "#fff" }}>
          {text}
        </T>
      )}
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ */
/* REEL CARD                                                           */
/* ------------------------------------------------------------------ */
type ReelCardProps = {
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

function ReelCard(p: ReelCardProps) {
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
        style={StyleSheet.absoluteFill}
      />
      <GridBg />

      {/* oynat / duraklat alanı */}
      <Pressable style={StyleSheet.absoluteFill} onPress={p.onTogglePlay} />

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

/* ------------------------------------------------------------------ */
/* MAIN                                                                */
/* ------------------------------------------------------------------ */
type Screen = "home" | "feed" | "new" | "rewards" | "profile" | "list";
type SheetName = "" | "quiz" | "ask" | "question" | "filter";

function Main() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [screen, setScreen] = useState<Screen>("home");
  const [credits, setCredits] = useState(40);
  const [earnedToday, setEarnedToday] = useState(0);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([
    "Matematik 1",
    "Fizik 1",
  ]);
  const [onboarded, setOnboarded] = useState(false);
  const [interests, setInterests] = useState<string[]>([
    "Matematik",
    "Fizik",
    "Uzay",
  ]);

  const [reels, setReels] = useState<Reel[]>(initialReels);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [finished, setFinished] = useState<string[]>([]);
  const [learned, setLearned] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [awarded, setAwarded] = useState<string[]>([]);
  const [stats, setStats] = useState({ total: 25, correct: 18 });

  const [joinedCourses, setJoinedCourses] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [bio, setBio] = useState(
    "Merhaba! Matematik 1 ve Fizik 1 çalışıyorum.",
  );
  const [searchText, setSearchText] = useState("");
  const [courseFilter, setCourseFilter] = useState("Tümü");
  const [listType, setListType] = useState<"lessons" | "questions">("lessons");

  const [sheet, setSheet] = useState<SheetName>("");
  const [toast, setToast] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState(0);
  const [askCourse, setAskCourse] = useState(courses[0]);
  const [askTopic, setAskTopic] = useState("");
  const [askText, setAskText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [quizStep, setQuizStep] = useState(0);
  const [quizChoice, setQuizChoice] = useState<number | null>(null);

  // içerik üret formu
  const [videoSelected, setVideoSelected] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formTopic, setFormTopic] = useState("");
  const [formCourse, setFormCourse] = useState(courses[0]);
  const [q1, setQ1] = useState<QForm>(emptyQ());
  const [q2, setQ2] = useState<QForm>(emptyQ());
  const [showQ2, setShowQ2] = useState(false);
  const [formError, setFormError] = useState("");

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  // layout ölçüleri
  const NAV_H = 67;
  const NAV_WRAP = 83;
  const navBottom = insets.bottom + 10;
  const navTop = navBottom + NAV_WRAP; // nav'ın üst sınırı (ekran altından)
  const bodyPad = navTop + 24;

  const visibleReels = useMemo(
    () =>
      reels.filter(
        (r) => r.course === FACT || selectedCourses.includes(r.course),
      ),
    [reels, selectedCourses],
  );
  const safeIndex = Math.min(activeIndex, Math.max(0, visibleReels.length - 1));
  const activeReel: Reel | undefined = visibleReels[safeIndex];

  const filteredLessons = useMemo(
    () =>
      lessons.filter(
        (x) =>
          selectedCourses.includes(x.course) &&
          (courseFilter === "Tümü" || x.course === courseFilter) &&
          `${x.title} ${x.teacher} ${x.course}`
            .toLowerCase()
            .includes(searchText.toLowerCase()),
      ),
    [selectedCourses, courseFilter, searchText],
  );
  const filteredQuestions = useMemo(
    () =>
      questions.filter(
        (x) =>
          selectedCourses.includes(x.course) &&
          (courseFilter === "Tümü" || x.course === courseFilter) &&
          `${x.text} ${x.name} ${x.course} ${x.topic}`
            .toLowerCase()
            .includes(searchText.toLowerCase()),
      ),
    [questions, selectedCourses, courseFilter, searchText],
  );

  const showToast = useCallback((m: string) => {
    setToast(m);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 1800);
  }, []);
  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const openFeed = useCallback(
    (id?: string) => {
      let idx = 0;
      if (id) {
        const i = visibleReels.findIndex((r) => r.id === id);
        if (i >= 0) idx = i;
      }
      const target = visibleReels[idx];
      const done = target ? finished.includes(target.id) : false;
      setActiveIndex(idx);
      setProgress(done ? 1 : 0);
      setPlaying(!done);
      setSheet("");
      setScreen("feed");
      setTimeout(
        () => feedRef.current?.scrollTo({ y: idx * height, animated: false }),
        30,
      );
    },
    [visibleReels, finished, height],
  );

  const goTab = (s: Screen) => {
    setSheet("");
    if (s === "feed") return openFeed();
    setScreen(s);
  };

  const toggleCourse = (c: string) => {
    setSelectedCourses((prev) => {
      if (prev.includes(c)) {
        if (prev.length === 1) {
          showToast("En az bir ders seçili olmalı");
          return prev;
        }
        return prev.filter((x) => x !== c);
      }
      return [...prev, c];
    });
  };
  const toggleIn = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const awardCredit = () => {
    if (earnedToday >= DAILY_CAP)
      return showToast("Günlük kredi tavanına ulaştın");
    setCredits((c) => c + 5);
    setEarnedToday((n) => Math.min(DAILY_CAP, n + 5));
    showToast("+5 kredi");
  };

  /* ---- reels zamanlayıcı ---- */
  const activeId = activeReel?.id;
  const activeFinished = activeId ? finished.includes(activeId) : false;
  useEffect(() => {
    if (screen !== "feed" || !playing || !activeId || activeFinished) return;
    const t = setInterval(
      () => setProgress((p) => Math.min(1, p + 0.0086)),
      120,
    );
    return () => clearInterval(t);
  }, [screen, playing, activeId, activeFinished]);
  useEffect(() => {
    if (screen === "feed" && activeId && progress >= 1 && !activeFinished) {
      setFinished((f) => [...f, activeId]);
      setPlaying(false);
    }
  }, [screen, progress, activeId, activeFinished]);

  const onFeedScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.y / height);
    if (i !== safeIndex && visibleReels[i]) {
      const done = finished.includes(visibleReels[i].id);
      setActiveIndex(i);
      setProgress(done ? 1 : 0);
      setPlaying(!done);
    }
  };

  /* ---- quiz ---- */
  const quizList = activeReel?.quiz ?? [];
  const quizOptions = useMemo(() => {
    const qq = quizList[quizStep];
    if (!qq) return [];
    return shuffle([
      { text: qq.correct, ok: true },
      ...qq.wrong.map((w) => ({ text: w, ok: false })),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, quizStep, sheet]);

  const openQuiz = () => {
    if (!activeReel || activeReel.quiz.length === 0) return;
    setQuizStep(0);
    setQuizChoice(null);
    setSheet("quiz");
  };
  const pickOption = (i: number) => {
    if (quizChoice !== null || !activeReel) return;
    setQuizChoice(i);
    const ok = quizOptions[i].ok;
    setStats((s) => ({
      total: s.total + 1,
      correct: s.correct + (ok ? 1 : 0),
    }));
    if (ok) {
      const key = `${activeReel.id}-${quizStep}`;
      if (!awarded.includes(key)) {
        setAwarded((a) => [...a, key]);
        awardCredit();
      } else showToast("Bu soruda kredi daha önce alındı");
    }
  };
  const nextQuiz = () => {
    if (quizChoice === null) return showToast("Önce bir seçenek işaretle");
    if (quizStep < quizList.length - 1) {
      setQuizStep(quizStep + 1);
      setQuizChoice(null);
    } else {
      setSheet("");
      setQuizStep(0);
      setQuizChoice(null);
      showToast("Quiz tamamlandı");
    }
  };

  /* ---- içerik üret ---- */
  const qComplete = (q: QForm) =>
    q.q.trim() && q.correct.trim() && q.wrong.every((w) => w.trim());
  const qEmpty = (q: QForm) =>
    !q.q.trim() && !q.correct.trim() && q.wrong.every((w) => !w.trim());
  const publish = () => {
    if (!formTitle.trim() || !formTopic.trim())
      return setFormError("Başlık ve konu gerekli.");
    if (!videoSelected)
      return setFormError("20 sn ile 2 dk arasında bir video seç.");
    if (!qComplete(q1))
      return setFormError("İlk soru için soru metnini ve 4 şıkkı doldur.");
    if (showQ2 && !qEmpty(q2) && !qComplete(q2))
      return setFormError("Soru 2 için soru metnini ve 4 şıkkı doldur.");
    const toQuiz = (q: QForm): Quiz => ({
      q: q.q.trim(),
      correct: q.correct.trim(),
      wrong: q.wrong.map((w) => w.trim()),
      exp: q.exp.trim() || "Üretici bu soru için açıklama eklemedi.",
    });
    const quiz = [toQuiz(q1), ...(showQ2 && qComplete(q2) ? [toQuiz(q2)] : [])];
    const id = `u${Date.now()}`;
    const reel: Reel = {
      id,
      course: formCourse,
      creator: "Ada Yılmaz",
      initials: "AY",
      color: "#7276F4",
      title: formTitle.trim(),
      lines: [
        formTitle.trim(),
        `Konu: ${formTopic.trim()}`,
        formCourse,
        "Yeni içerik ✦",
      ],
      result: "Yeni içerik ✦",
      quiz,
    };
    setReels((r) => [reel, ...r]);
    setSelectedCourses((s) =>
      s.includes(formCourse) ? s : [...s, formCourse],
    );
    setFormTitle("");
    setFormTopic("");
    setQ1(emptyQ());
    setQ2(emptyQ());
    setShowQ2(false);
    setVideoSelected(false);
    setFormError("");
    showToast("Videon yayınlandı");
    // yeni state ile yeniden hesaplanması için bir sonraki tick'te aç
    setScreen("feed");
    setActiveIndex(0);
    setProgress(0);
    setPlaying(true);
    setTimeout(() => feedRef.current?.scrollTo({ y: 0, animated: false }), 30);
  };

  const sendQuestion = () => {
    if (!askText.trim()) return showToast("Sorunu yazmayı unutma");
    setQuestions((qs) => [
      {
        name: "Ada",
        initials: "AY",
        color: "#8B8CF8",
        course: askCourse,
        topic: askTopic.trim() || "Genel",
        text: askText.trim(),
        answers: [],
      },
      ...qs,
    ]);
    setSelectedCourses((s) => (s.includes(askCourse) ? s : [...s, askCourse]));
    setAskText("");
    setAskTopic("");
    setSheet("");
    showToast("Sorun paylaşıldı");
  };
  const sendAnswer = () => {
    if (!answerText.trim()) return showToast("Yanıtını yazmayı unutma");
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === selectedQuestion
          ? { ...q, answers: [...q.answers, answerText.trim()] }
          : q,
      ),
    );
    setAnswerText("");
    showToast("Yanıtın eklendi");
  };
  const openQuestion = (q: Question) => {
    setSelectedQuestion(questions.indexOf(q));
    setAnswerText("");
    setSheet("question");
  };
  const openList = (t: "lessons" | "questions") => {
    setListType(t);
    setSearchText("");
    setScreen("list");
  };

  /* ---------------------------------------------------------------- */
  /* BÖLÜMLER                                                         */
  /* ---------------------------------------------------------------- */
  const header = (
    <View
      style={{
        paddingTop: insets.top + 8,
        paddingHorizontal: 19,
        paddingBottom: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: C.foam,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
        <LinearGradient
          colors={G_PRIMARY}
          {...DIAG}
          style={{
            width: 28,
            height: 28,
            borderTopLeftRadius: 14,
            borderTopRightRadius: 14,
            borderBottomRightRadius: 14,
            borderBottomLeftRadius: 5,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Svg width={16} height={10} viewBox="0 0 16 10">
            <Path
              d="M1 6 Q4 0 8 5 T15 4"
              stroke="#fff"
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
            />
          </Svg>
        </LinearGradient>
        <T f="h" style={{ fontSize: 20, color: C.abyss, letterSpacing: -0.6 }}>
          Dersakış
        </T>
      </View>
      <View
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 10,
            paddingVertical: 8,
            borderRadius: 999,
            backgroundColor: "#fff",
            overflow: "hidden",
          },
          SH.soft,
        ]}
      >
        <View style={{ position: "absolute", left: -6, top: -10 }}>
          <Sonar size={44} color="rgba(27,107,255,.14)" />
        </View>
        <LinearGradient
          colors={[C.sun, "#FFBC60"]}
          {...DIAG}
          style={{
            width: 19,
            height: 19,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <T f="bb" style={{ fontSize: 10, color: "#825A17" }}>
            ✦
          </T>
        </LinearGradient>
        <T f="bb" style={{ fontSize: 11, color: C.abyss }}>
          {credits} kredi
        </T>
        <View
          style={{
            width: 35,
            height: 3,
            borderRadius: 9,
            backgroundColor: C.mist,
          }}
        >
          <View
            style={{
              width: `${Math.min(100, (earnedToday / DAILY_CAP) * 100)}%`,
              height: 3,
              borderRadius: 9,
              backgroundColor: C.tide,
            }}
          />
        </View>
      </View>
    </View>
  );

  const scrollProps = {
    showsVerticalScrollIndicator: false,
    keyboardShouldPersistTaps: "handled" as const,
    automaticallyAdjustKeyboardInsets: true,
    contentContainerStyle: { paddingHorizontal: 20, paddingBottom: bodyPad },
  };

  /* ---- ANASAYFA ---- */
  const homeView = (
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
        <T
          f="bb"
          style={{ fontSize: 12, letterSpacing: 1.2, color: "#AEEBF2" }}
        >
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
          onPress={() => goTab("feed")}
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
              {credits}
            </T>{" "}
            kredi
          </T>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <Flame size={12} color="#EAF5FF" />
            <T style={{ fontSize: 11, color: "#EAF5FF" }}>
              <T f="bb" style={{ fontSize: 11, color: "#EAF5FF" }}>
                12
              </T>{" "}
              gün seri
            </T>
          </View>
          <T style={{ fontSize: 11, color: "#EAF5FF" }}>
            <T f="bb" style={{ fontSize: 11, color: "#EAF5FF" }}>
              %{Math.round((stats.correct / stats.total) * 100)}
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
            value={searchText}
            onChangeText={setSearchText}
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
          onPress={() => setSheet("filter")}
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
          active={courseFilter === "Tümü"}
          onPress={() => setCourseFilter("Tümü")}
        >
          Tümü
        </Chip>
        {courses.map((c) => (
          <Chip
            key={c}
            active={courseFilter === c}
            onPress={() => setCourseFilter(courseFilter === c ? "Tümü" : c)}
          >
            {c}
          </Chip>
        ))}
      </ScrollView>

      {/* EĞİTİMLER */}
      <SectionTitle
        title="Eğitimler"
        action="Tümünü gör"
        onAction={() => openList("lessons")}
      />
      {filteredLessons.length === 0 ? (
        <T style={{ color: C.muted, fontSize: 12 }}>
          Aramana uygun eğitim bulunamadı.
        </T>
      ) : (
        <FlatList
          horizontal
          data={filteredLessons}
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
            const joined = joinedCourses.includes(item.title);
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
                    <Avatar
                      initials={item.initials}
                      color={item.color}
                      size={32}
                    />
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
                    colors={joined ? ([C.success, C.success] as G2) : G_CORAL}
                    onPress={() => {
                      if (!joined) {
                        setJoinedCourses((j) => [...j, item.title]);
                        showToast("Eğitime katıldın");
                      }
                    }}
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
        onAction={() => openList("questions")}
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
          onPress={() => setSheet("ask")}
        />
      </View>
      {filteredQuestions.length === 0 ? (
        <T style={{ color: C.muted, fontSize: 12 }}>
          Seçtiğin derslerde soru yok. İlk soruyu sen sor.
        </T>
      ) : (
        <FlatList
          horizontal
          data={filteredQuestions}
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
              onPress={() => openQuestion(item)}
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
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
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

  /* ---- AKIŞ ---- */
  const feedView = (
    <View style={{ flex: 1, backgroundColor: C.abyss }}>
      <ScrollView
        ref={feedRef}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        onMomentumScrollEnd={onFeedScrollEnd}
      >
        {visibleReels.map((reel, idx) => (
          <ReelCard
            key={reel.id}
            reel={reel}
            width={width}
            height={height}
            topInset={insets.top}
            bottomOffset={navTop}
            active={idx === safeIndex}
            progress={idx === safeIndex ? progress : 0}
            playing={playing}
            finished={finished.includes(reel.id)}
            learned={learned.includes(reel.id)}
            saved={saved.includes(reel.id)}
            onTogglePlay={() => {
              if (idx !== safeIndex) return;
              if (progress >= 1) return;
              setPlaying((v) => !v);
            }}
            onLearn={() => {
              setLearned((l) => toggleIn(l, reel.id));
            }}
            onSave={() => {
              setSaved((s) => toggleIn(s, reel.id));
              showToast(
                saved.includes(reel.id)
                  ? "Kaydedilenlerden çıkarıldı"
                  : "Kaydettiklerime eklendi",
              );
            }}
            onShare={() => showToast("Bağlantı kopyalandı")}
            onQuiz={openQuiz}
            onReplay={() => {
              setFinished((f) => f.filter((x) => x !== reel.id));
              setProgress(0);
              setPlaying(true);
            }}
            onSeek={(p) => {
              setProgress(p);
              setPlaying(false);
            }}
            onBack={() => setScreen("home")}
          />
        ))}
      </ScrollView>
    </View>
  );

  /* ---- İÇERİK ÜRET ---- */
  const questionForm = (q: QForm, set: (q: QForm) => void) => (
    <>
      <Field
        label="Soru"
        value={q.q}
        onChange={(v) => set({ ...q, q: v })}
        placeholder="Öğrencine ne sormak istersin?"
      />
      <Field
        label="Doğru cevap"
        value={q.correct}
        onChange={(v) => set({ ...q, correct: v })}
        placeholder="Doğru seçenek"
      />
      <T f="bb" style={{ color: C.muted, fontSize: 12, marginBottom: 8 }}>
        Yanlış seçenekler
      </T>
      {q.wrong.map((w, i) => (
        <TextInput
          key={i}
          value={w}
          onChangeText={(v) =>
            set({ ...q, wrong: q.wrong.map((x, j) => (j === i ? v : x)) })
          }
          placeholder={`Yanlış seçenek ${i + 1}`}
          placeholderTextColor="#9AA9BD"
          style={{
            height: 44,
            borderRadius: 13,
            borderWidth: 1,
            borderColor: C.mist,
            backgroundColor: "#fff",
            paddingHorizontal: 12,
            fontFamily: FONT.b,
            fontSize: 13,
            color: C.ink,
            marginBottom: 8,
          }}
        />
      ))}
      <View style={{ height: 6 }} />
      <Field
        label="Kısa açıklama (isteğe bağlı)"
        value={q.exp}
        onChange={(v) => set({ ...q, exp: v })}
        placeholder="Cevabın neden doğru olduğunu açıkla"
        multiline
      />
    </>
  );
  const card: ViewStyle = {
    padding: 15,
    borderRadius: 20,
    backgroundColor: "#fff",
    marginBottom: 13,
  };

  const newView = (
    <ScrollView {...scrollProps}>
      <T f="h" style={{ fontSize: 25, marginTop: 8, marginBottom: 5 }}>
        İçerik üret
      </T>
      <T
        style={{
          fontSize: 12,
          lineHeight: 18,
          color: C.muted,
          marginBottom: 17,
        }}
      >
        20 saniye ile 2 dakika arasında bir video yükle. Videonun sonuna en
        fazla 2 soru ekleyebilirsin.
      </T>

      <View
        style={[
          fin,
          {
            borderWidth: 1.5,
            borderStyle: "dashed",
            borderColor: "#A9C4E6",
            backgroundColor: "#EEF6FF",
            padding: 20,
            alignItems: "center",
            marginBottom: 14,
            overflow: "hidden",
          },
        ]}
      >
        <View style={{ position: "absolute", top: 10, opacity: 0.5 }}>
          <Sonar size={120} color="rgba(27,107,255,.18)" />
        </View>
        <View
          style={[
            {
              width: 42,
              height: 42,
              backgroundColor: "#fff",
              borderRadius: 15,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 8,
            },
            SH.soft,
          ]}
        >
          <Upload size={19} color={C.tide} />
        </View>
        {videoSelected ? (
          <View
            style={{
              alignSelf: "stretch",
              padding: 10,
              borderRadius: 13,
              backgroundColor: "#fff",
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <CheckCircle2 size={18} color={C.success} />
            <View>
              <T f="bb" style={{ fontSize: 12 }}>
                ders_videosu.mp4
              </T>
              <T style={{ color: C.success, fontSize: 10 }}>0:45 · uygun</T>
            </View>
          </View>
        ) : (
          <>
            <T f="bb" style={{ fontSize: 14 }}>
              Dersini kısa ve öz anlat
            </T>
            <T
              style={{
                color: C.muted,
                fontSize: 11,
                marginTop: 5,
                marginBottom: 10,
              }}
            >
              MP4 · 20 sn – 2 dk
            </T>
            <GradBtn
              label="Video seç"
              small
              colors={G_PRIMARY}
              radius={{ borderRadius: 12 }}
              onPress={() => {
                setVideoSelected(true);
                setFormError("");
              }}
            />
          </>
        )}
      </View>

      <View style={[card, SH.soft]}>
        <Field
          label="Başlık · en fazla 70 karakter"
          value={formTitle}
          onChange={setFormTitle}
          placeholder="Örn. Limitin temel mantığı"
          maxLength={70}
        />
        <T f="bb" style={{ fontSize: 12, color: C.muted, marginBottom: 7 }}>
          Ders
        </T>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 7,
            marginBottom: 14,
          }}
        >
          {courses.map((c) => (
            <Chip
              key={c}
              active={formCourse === c}
              onPress={() => setFormCourse(c)}
            >
              {c}
            </Chip>
          ))}
        </View>
        <Field
          label="Konu · en fazla 40 karakter"
          value={formTopic}
          onChange={setFormTopic}
          placeholder="Örn. Belirsiz ifadeler"
          maxLength={40}
        />
      </View>

      <View style={[card, SH.soft]}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 11,
          }}
        >
          <T f="bb" style={{ fontSize: 15 }}>
            Soru 1
          </T>
          <T f="bb" style={{ color: C.coral, fontSize: 11 }}>
            zorunlu
          </T>
        </View>
        {questionForm(q1, setQ1)}
      </View>

      <View style={[card, SH.soft]}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: showQ2 ? 11 : 8,
          }}
        >
          <T f="bb" style={{ fontSize: 15 }}>
            Soru 2
          </T>
          <T style={{ color: C.muted, fontSize: 11 }}>isteğe bağlı</T>
        </View>
        {showQ2 ? (
          questionForm(q2, setQ2)
        ) : (
          <Press
            onPress={() => setShowQ2(true)}
            style={{
              minHeight: 44,
              borderRadius: 13,
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: C.mist,
              backgroundColor: C.foam,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <T f="bb" style={{ color: C.tide }}>
              ＋ İkinci soru ekle
            </T>
          </Press>
        )}
      </View>

      {formError ? (
        <T f="bs" style={{ color: C.error, fontSize: 12, marginBottom: 10 }}>
          {formError}
        </T>
      ) : null}
      <GradBtn
        label="Yayınla"
        onPress={publish}
        style={[{ marginBottom: 15 }, SH.soft]}
      />
    </ScrollView>
  );

  /* ---- PREMIUM ---- */
  const rewardIcon = (i: RewardIcon) => {
    const p = { size: 22, color: "#fff" };
    switch (i) {
      case "crown":
        return <Crown {...p} />;
      case "spark":
        return <Sparkles {...p} />;
      case "mentor":
        return <UserRound {...p} />;
      case "exam":
        return <CheckCircle2 {...p} />;
      default:
        return <Gem {...p} />;
    }
  };
  const rewardsView = (
    <ScrollView {...scrollProps}>
      <T f="h" style={{ fontSize: 24, marginTop: 9, marginBottom: 15 }}>
        Premium ödüller
      </T>
      <LinearGradient
        colors={[C.abyss, C.deep, "#24A3C2"]}
        locations={[0, 0.65, 1]}
        {...DIAG}
        style={[
          fin,
          { padding: 20, paddingVertical: 21, overflow: "hidden" },
          SH.card,
        ]}
      >
        <View
          style={{ position: "absolute", right: 15, top: 10, opacity: 0.45 }}
        >
          <Sonar size={120} />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <LinearGradient
            colors={["#FFECA9", "#FFCA61"]}
            {...DIAG}
            style={{
              width: 38,
              height: 38,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <T f="bb" style={{ fontSize: 18, color: "#825A17" }}>
              ✦
            </T>
          </LinearGradient>
          <View>
            <T style={{ fontSize: 11, color: "#BBD8F2" }}>DERSAKIŞ CÜZDANIN</T>
            <T f="h" style={{ fontSize: 21, color: "#fff" }}>
              Bakiyen: {credits} kredi
            </T>
          </View>
        </View>
        <T style={{ color: "#D3E7FB", fontSize: 11, marginTop: 15 }}>
          Bilgiyi yakala, güzel şeylerin kilidini aç.
        </T>
      </LinearGradient>

      <SectionTitle title="Senin için seçtik" />
      <View style={{ gap: 10 }}>
        {rewardsData.map((r) => {
          const can = credits >= r.price;
          return (
            <View
              key={r.name}
              style={[
                r.featured ? fin : { borderRadius: 18 },
                {
                  minHeight: r.featured ? 114 : 88,
                  padding: 13,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  backgroundColor: r.featured ? "#F1F7FF" : "#fff",
                  borderWidth: 1,
                  borderColor: r.featured ? "#B9D7FF" : C.mist,
                },
                SH.soft,
              ]}
            >
              <LinearGradient
                colors={[r.featured ? C.coral : C.tide, C.lagoon]}
                {...DIAG}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {rewardIcon(r.icon)}
              </LinearGradient>
              <View style={{ flex: 1 }}>
                {r.featured && (
                  <T
                    f="bb"
                    style={{ color: C.coral, fontSize: 9, letterSpacing: 0.8 }}
                  >
                    ÖNE ÇIKAN
                  </T>
                )}
                <T f="bb" style={{ fontSize: 13, lineHeight: 17 }}>
                  {r.name}
                </T>
                <T style={{ color: C.muted, fontSize: 10, marginTop: 5 }}>
                  {r.source}
                </T>
              </View>
              <GradBtn
                label={`${r.price} ✦`}
                small
                disabled={!can}
                radius={{ borderRadius: 999 }}
                onPress={() => {
                  if (can) {
                    setCredits((c) => c - r.price);
                    showToast("Ödül alındı");
                  }
                }}
              />
            </View>
          );
        })}
      </View>
      <T
        style={{
          textAlign: "center",
          color: C.muted,
          fontSize: 10,
          lineHeight: 15,
          marginVertical: 16,
          marginHorizontal: 12,
        }}
      >
        Ödüller bu prototipte örnektir, gerçek bir teslimat yoktur.
      </T>
    </ScrollView>
  );

  /* ---- PROFİL ---- */
  const acc = Math.round((stats.correct / stats.total) * 100);
  const profileView = (
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
            onPress={() => showToast("Fotoğraf seçimi yakında")}
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
          value={bio}
          onChange={setBio}
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
          <T style={{ color: C.muted, fontSize: 10 }}>{bio.length}/160</T>
          <GradBtn
            label="Kaydet"
            small
            colors={[C.tide, C.tide]}
            radius={{ borderRadius: 11 }}
            onPress={() => showToast("Profilin kaydedildi")}
          />
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 8, marginVertical: 14 }}>
        {[
          [String(12 + finished.length), "video izlendi"],
          [String(earnedToday), "bugün kazanılan"],
          [String(saved.length), "kaydedilen"],
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
            {stats.total} soru çözdün, {stats.correct} doğru. Böyle devam!
          </T>
        </View>
      </LinearGradient>
      {courses
        .filter((c) => selectedCourses.includes(c))
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
                <T
                  f="bb"
                  style={{ fontSize: 12, color: low ? C.coral : C.tide }}
                >
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
      {saved.length === 0 ? (
        <View
          style={{ padding: 15, borderRadius: 17, backgroundColor: "#fff" }}
        >
          <T style={{ color: C.muted, fontSize: 12 }}>
            Henüz kaydettiğin video yok. Akışta bir videoya yer imi ekle.
          </T>
        </View>
      ) : (
        saved.map((id) => {
          const r = reels.find((x) => x.id === id);
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
              <Chip onPress={() => openFeed(id)}>İzle</Chip>
              <Chip onPress={() => setSaved((s) => s.filter((x) => x !== id))}>
                Çıkar
              </Chip>
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
            active={selectedCourses.includes(c)}
            onPress={() => toggleCourse(c)}
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
            active={interests.includes(c)}
            onPress={() => setInterests((x) => toggleIn(x, c))}
          >
            {c}
          </Chip>
        ))}
      </View>
    </ScrollView>
  );

  /* ---- LİSTE ---- */
  const lk = searchText.toLowerCase();
  const listLessons = lessons.filter(
    (x) =>
      selectedCourses.includes(x.course) &&
      `${x.title} ${x.course} ${x.teacher}`.toLowerCase().includes(lk),
  );
  const listQuestions = questions.filter(
    (x) =>
      selectedCourses.includes(x.course) &&
      `${x.text} ${x.course} ${x.topic} ${x.name}`.toLowerCase().includes(lk),
  );
  const listEmpty =
    (listType === "lessons" ? listLessons : listQuestions).length === 0;
  const listView = (
    <View style={{ flex: 1, paddingTop: insets.top + 12 }}>
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
            onPress={() => setScreen("home")}
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
            {listType === "lessons" ? "Tüm eğitimler" : "Tüm sorular"}
          </T>
        </View>
        <View style={{ marginBottom: 14, justifyContent: "center" }}>
          <View style={{ position: "absolute", left: 13, zIndex: 2 }}>
            <Search size={16} color={C.muted} />
          </View>
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
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
        {listType === "lessons"
          ? listLessons.map((item) => (
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
          : listQuestions.map((item) => (
              <Press
                key={item.text}
                onPress={() => openQuestion(item)}
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

  /* ---- ALT NAV ---- */
  const navItems: {
    id: Screen;
    label: string;
    icon: (c: string) => React.ReactNode;
  }[] = [
    {
      id: "home",
      label: "Anasayfa",
      icon: (c) => <Home size={19} color={c} />,
    },
    {
      id: "feed",
      label: "Akış",
      icon: (c) => <PlayCircle size={20} color={c} />,
    },
    {
      id: "rewards",
      label: "Premium",
      icon: (c) => <Gem size={19} color={c} />,
    },
    {
      id: "profile",
      label: "Profil",
      icon: (c) => <UserRound size={19} color={c} />,
    },
  ];
  const currentTab: Screen = screen === "list" ? "home" : screen;
  const navBtn = (it: (typeof navItems)[number]) => {
    const on = currentTab === it.id;
    const col = on ? C.tide : "#8090A6";
    return (
      <Press
        key={it.id}
        onPress={() => goTab(it.id)}
        style={{
          flex: 1,
          height: NAV_H,
          alignItems: "center",
          justifyContent: "center",
          gap: 3,
        }}
      >
        {it.icon(col)}
        <T f={on ? "bb" : "bm"} style={{ fontSize: 10, color: col }}>
          {it.label}
        </T>
        {on && (
          <View
            style={{
              position: "absolute",
              bottom: 3,
              width: 15,
              height: 3,
              borderRadius: 9,
              backgroundColor: C.tide,
            }}
          />
        )}
      </Press>
    );
  };
  const nav = (
    <View
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: navBottom,
        height: NAV_WRAP,
        zIndex: 20,
      }}
      pointerEvents="box-none"
    >
      <View
        style={[
          {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: NAV_H,
            borderRadius: 24,
            backgroundColor: "rgba(255,255,255,.97)",
            borderWidth: 1,
            borderColor: "rgba(220,234,247,.8)",
          },
          shadow(0.17, 16, 8),
        ]}
      />
      <View
        style={{
          position: "absolute",
          left: 6,
          right: 6,
          bottom: 0,
          height: NAV_H,
          flexDirection: "row",
          alignItems: "center",
        }}
        pointerEvents="box-none"
      >
        {navBtn(navItems[0])}
        {navBtn(navItems[1])}
        <View style={{ flex: 1 }} />
        {navBtn(navItems[2])}
        {navBtn(navItems[3])}
      </View>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          alignItems: "center",
        }}
        pointerEvents="box-none"
      >
        <View
          style={{
            position: "absolute",
            top: -8,
            width: 72,
            height: 72,
            borderRadius: 36,
            borderWidth: 1,
            borderColor: "rgba(255,122,92,.22)",
          }}
          pointerEvents="none"
        />
        <Press
          onPress={() => goTab("new")}
          style={[
            {
              width: 56,
              height: 56,
              borderRadius: 28,
              overflow: "hidden",
              alignItems: "center",
              justifyContent: "center",
            },
            shadow(0.34, 12, 8, C.coral),
          ]}
        >
          <LinearGradient
            colors={[C.coral, C.sun]}
            {...DIAG}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={{
              position: "absolute",
              top: 5,
              left: 5,
              right: 5,
              bottom: 5,
              borderRadius: 28,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,.4)",
            }}
          />
          <Plus size={25} color="#fff" />
        </Press>
      </View>
    </View>
  );

  /* ---- SHEET'LER ---- */
  const q = quizList[quizStep];
  const quizSheet = sheet === "quiz" && q && (
    <Sheet onClose={() => setSheet("")} toast={toast}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <View style={{ flex: 1, paddingRight: 8 }}>
          <T f="bb" style={{ color: C.tide, fontSize: 11 }}>
            SORU {quizStep + 1}/{quizList.length} ·{" "}
            {activeReel?.course.toUpperCase()}
          </T>
          <T
            f="h"
            style={{
              fontSize: 21,
              lineHeight: 26,
              marginTop: 5,
              marginBottom: 15,
            }}
          >
            {q.q}
          </T>
        </View>
        <Press
          onPress={() => setSheet("")}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#fff",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={18} color={C.muted} />
        </Press>
      </View>
      {quizOptions.map((o, i) => {
        const picked = quizChoice === i;
        const showOk = quizChoice !== null && o.ok;
        const bad = picked && !o.ok;
        return (
          <Press
            key={o.text}
            onPress={() => pickOption(i)}
            style={{
              minHeight: 48,
              paddingHorizontal: 15,
              paddingVertical: 10,
              marginBottom: 9,
              borderRadius: 15,
              borderWidth: 1,
              flexDirection: "row",
              alignItems: "center",
              borderColor: showOk ? "#9CD8B5" : bad ? "#FFC3B6" : C.mist,
              backgroundColor: showOk ? "#E4F5EC" : bad ? "#FFF0ED" : "#fff",
            }}
          >
            <T f="bb" style={{ width: 24, color: C.muted }}>
              {String.fromCharCode(65 + i)}
            </T>
            <T
              f="bs"
              style={{
                flex: 1,
                color: showOk ? C.success : bad ? C.error : C.ink,
              }}
            >
              {o.text}
            </T>
          </Press>
        );
      })}
      {quizChoice !== null && (
        <View
          style={{
            borderRadius: 14,
            padding: 12,
            marginBottom: 12,
            backgroundColor: quizOptions[quizChoice].ok ? "#E7F6EE" : "#FFF2EF",
          }}
        >
          <T
            style={{
              fontSize: 12,
              lineHeight: 18,
              color: quizOptions[quizChoice].ok ? C.success : C.error,
            }}
          >
            <T
              f="bb"
              style={{
                fontSize: 12,
                color: quizOptions[quizChoice].ok ? C.success : C.error,
              }}
            >
              {quizOptions[quizChoice].ok ? "Doğru. " : "Yanlış. "}
            </T>
            {q.exp}
          </T>
        </View>
      )}
      <GradBtn
        label={quizStep === quizList.length - 1 ? "Bitir" : "Sonraki soru"}
        colors={G_PRIMARY}
        onPress={nextQuiz}
      />
    </Sheet>
  );

  const askSheet = sheet === "ask" && (
    <Sheet onClose={() => setSheet("")} toast={toast}>
      <T f="h" style={{ fontSize: 21, marginTop: 3, marginBottom: 15 }}>
        Bilene sor
      </T>
      <T f="bb" style={{ fontSize: 12, color: C.muted, marginBottom: 7 }}>
        Ders
      </T>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 7,
          marginBottom: 14,
        }}
      >
        {courses.map((c) => (
          <Chip
            key={c}
            active={askCourse === c}
            onPress={() => setAskCourse(c)}
          >
            {c}
          </Chip>
        ))}
      </View>
      <Field
        label="Konu"
        value={askTopic}
        onChange={setAskTopic}
        placeholder="Örn. Limit"
        maxLength={40}
      />
      <Field
        label="Sorun"
        value={askText}
        onChange={setAskText}
        placeholder="Aklındaki soruyu yaz..."
        multiline
        maxLength={240}
      />
      <GradBtn
        label="Soruyu paylaş"
        colors={G_PRIMARY}
        icon={<Send size={14} color="#fff" />}
        onPress={sendQuestion}
      />
    </Sheet>
  );

  const sq = questions[selectedQuestion];
  const questionSheet = sheet === "question" && sq && (
    <Sheet onClose={() => setSheet("")} toast={toast}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <T f="bb" style={{ color: C.tide, fontSize: 11 }}>
          {sq.course} · {sq.topic}
        </T>
        <Press
          onPress={() => setSheet("")}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#fff",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={18} color={C.muted} />
        </Press>
      </View>
      <T
        f="h"
        style={{ fontSize: 21, lineHeight: 25, marginTop: 9, marginBottom: 14 }}
      >
        {sq.text}
      </T>
      <T f="bb" style={{ fontSize: 12, marginBottom: 9 }}>
        Yanıtlar · {sq.answers.length}
      </T>
      {sq.answers.length === 0 && (
        <T style={{ color: C.muted, fontSize: 12, marginBottom: 12 }}>
          Henüz cevap yok. İlk cevabı sen ver.
        </T>
      )}
      {sq.answers.map((a, i) => (
        <View
          key={i}
          style={{
            padding: 13,
            borderRadius: 15,
            backgroundColor: "#fff",
            marginBottom: 8,
            flexDirection: "row",
            gap: 9,
          }}
        >
          <Avatar
            initials={i % 2 ? "MA" : "EY"}
            color={i % 2 ? "#F29C72" : "#8589F9"}
            size={29}
          />
          <T style={{ flex: 1, fontSize: 12, lineHeight: 18 }}>{a}</T>
        </View>
      ))}
      <View style={{ height: 6 }} />
      <Field
        label="Yanıtını yaz"
        value={answerText}
        onChange={setAnswerText}
        placeholder="Yardımcı olabileceğin bir şey var mı?"
        multiline
      />
      <GradBtn label="Yanıtla" colors={G_PRIMARY} onPress={sendAnswer} />
    </Sheet>
  );

  const filterSheet = sheet === "filter" && (
    <Sheet onClose={() => setSheet("")} toast={toast}>
      <T f="h" style={{ fontSize: 21, marginTop: 3, marginBottom: 15 }}>
        Dersini seç
      </T>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 18,
        }}
      >
        <Chip
          active={courseFilter === "Tümü"}
          onPress={() => setCourseFilter("Tümü")}
        >
          Tümü
        </Chip>
        {courses.map((c) => (
          <Chip
            key={c}
            active={courseFilter === c}
            onPress={() => setCourseFilter(c)}
          >
            {c}
          </Chip>
        ))}
      </View>
      <GradBtn label="Uygula" colors={G_PRIMARY} onPress={() => setSheet("")} />
    </Sheet>
  );

  const onboardingSheet = !onboarded && (
    <Sheet onClose={() => {}} toast={toast}>
      <View style={{ alignItems: "center", paddingBottom: 6 }}>
        <LinearGradient
          colors={G_PRIMARY}
          {...DIAG}
          style={{
            width: 52,
            height: 52,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
          }}
        >
          <Volume2 size={23} color="#fff" />
        </LinearGradient>
        <T f="h" style={{ fontSize: 22, textAlign: "center", marginBottom: 7 }}>
          Bugün hangi dersleri çalışıyorsun?
        </T>
        <T style={{ color: C.muted, fontSize: 12, marginBottom: 17 }}>
          Akışını sana göre hazırlayalım.
        </T>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 8,
            marginBottom: 18,
          }}
        >
          {courses.map((c) => (
            <Chip
              key={c}
              active={selectedCourses.includes(c)}
              onPress={() => toggleCourse(c)}
            >
              {c}
            </Chip>
          ))}
        </View>
        <GradBtn
          label="Devam et"
          colors={G_PRIMARY}
          style={{ alignSelf: "stretch" }}
          disabled={selectedCourses.length === 0}
          onPress={() => setOnboarded(true)}
        />
      </View>
    </Sheet>
  );

  /* ---- RENDER ---- */
  const showHeader =
    screen === "home" ||
    screen === "new" ||
    screen === "rewards" ||
    screen === "profile";
  return (
    <View style={{ flex: 1, backgroundColor: C.foam }}>
      <StatusBar style={screen === "feed" ? "light" : "dark"} />
      {showHeader && header}
      <View style={{ flex: 1 }}>
        {screen === "home" && homeView}
        {screen === "feed" && feedView}
        {screen === "new" && newView}
        {screen === "rewards" && rewardsView}
        {screen === "profile" && profileView}
        {screen === "list" && listView}
      </View>
      {nav}
      {sheet === "" && <Toast text={toast} bottom={navTop + 6} />}
      {quizSheet}
      {askSheet}
      {questionSheet}
      {filterSheet}
      {onboardingSheet}
    </View>
  );
}

export default function App() {
  const [loaded, error] = useFonts({
    BricolageGrotesque_500Medium,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    InstrumentSans_700Bold,
  });
  if (!loaded && !error)
    return <View style={{ flex: 1, backgroundColor: C.foam }} />;
  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  );
}
