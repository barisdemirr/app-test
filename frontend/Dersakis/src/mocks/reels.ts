import type { Reel } from "@/types";

export const FACT = "Biliyor muydun?";

export const initialReels: Reel[] = [
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