/** Karşılama akışının içeriği. Ders listesi yerel; girişten sonra sunucudaki derslerle anahtar kelimeyle eşlenir. */

export type LevelId = "ilkokul" | "ortaokul" | "lise" | "onlisans" | "lisans" | "yuksek";
export type Option = { id: string; label: string; emoji: string; hint?: string };

export const LEVELS: Option[] = [
  { id: "ilkokul", label: "İlkokul", emoji: "🎒", hint: "1–4. sınıf" },
  { id: "ortaokul", label: "Ortaokul", emoji: "📚", hint: "5–8. sınıf" },
  { id: "lise", label: "Lise", emoji: "🏫", hint: "9–12. sınıf" },
  { id: "onlisans", label: "Ön lisans", emoji: "🛠️", hint: "2 yıllık" },
  { id: "lisans", label: "Lisans", emoji: "🎓", hint: "Üniversite" },
  { id: "yuksek", label: "Yüksek lisans", emoji: "🔬", hint: "Master / doktora" },
];

export const TRACKS: Option[] = [
  { id: "sayisal", label: "Sayısal", emoji: "🧮", hint: "Matematik · Fen" },
  { id: "esit", label: "Eşit ağırlık", emoji: "⚖️", hint: "Matematik · Edebiyat" },
  { id: "sozel", label: "Sözel", emoji: "📖", hint: "Edebiyat · Sosyal" },
  { id: "dil", label: "Yabancı dil", emoji: "🌍", hint: "Dil ağırlıklı" },
  { id: "henuz", label: "Henüz seçmedim", emoji: "🌊", hint: "Hepsine göz at" },
];

export const DEPTS: Option[] = [
  { id: "bilgisayar", label: "Bilgisayar / Yazılım", emoji: "💻" },
  { id: "elektrik", label: "Elektrik-Elektronik", emoji: "⚡" },
  { id: "makine", label: "Makine / Endüstri", emoji: "⚙️" },
  { id: "insaat", label: "İnşaat / Mimarlık", emoji: "🏗️" },
  { id: "tip", label: "Tıp / Diş", emoji: "🩺" },
  { id: "saglik", label: "Hemşirelik / Eczacılık", emoji: "💊" },
  { id: "fen", label: "Matematik / Fizik", emoji: "🧪" },
  { id: "kimbiyo", label: "Kimya / Biyoloji", emoji: "🧬" },
  { id: "isletme", label: "İşletme / İktisat", emoji: "📈" },
  { id: "sosyal", label: "Hukuk / Psikoloji", emoji: "⚖️" },
  { id: "egitim", label: "Öğretmenlik", emoji: "🍎" },
  { id: "diger", label: "Diğer", emoji: "✨" },
];

/** "Etiket|anahtar": anahtar varsa sunucudaki bir derse (Matematik, Fizik, Kimya, Anatomi, Biyoloji) bağlanır. */
const S = (list: string[]) => list.map((x) => {
  const [label, key] = x.split("|");
  return { label, key: key ?? "" };
});
export type Subject = { label: string; key: string };

const SUBJECTS: Record<string, Subject[]> = {
  ilkokul: S(["Matematik|matematik", "Türkçe", "Hayat Bilgisi", "Fen Bilimleri|fizik", "İngilizce", "Sosyal Bilgiler", "Görsel Sanatlar", "Müzik", "Din Kültürü", "Satranç", "Kodlama"]),
  ortaokul: S(["Matematik|matematik", "Fen Bilimleri|fizik", "Türkçe", "İngilizce", "Sosyal Bilgiler", "T.C. İnkılap Tarihi", "Din Kültürü", "Bilişim / Kodlama", "Geometri|matematik", "LGS Hazırlık", "Müzik", "Görsel Sanatlar"]),
  "lise:sayisal": S(["Matematik|matematik", "Geometri|matematik", "Fizik|fizik", "Kimya|kimya", "Biyoloji|biyoloji", "Türk Dili ve Edebiyatı", "Tarih", "Coğrafya", "İngilizce", "Felsefe", "Bilişim Teknolojileri", "YKS-TYT", "YKS-AYT"]),
  "lise:esit": S(["Matematik|matematik", "Geometri|matematik", "Türk Dili ve Edebiyatı", "Tarih", "Coğrafya", "Felsefe", "İngilizce", "Fizik|fizik", "Kimya|kimya", "Biyoloji|biyoloji", "Psikoloji", "YKS-TYT", "YKS-AYT"]),
  "lise:sozel": S(["Türk Dili ve Edebiyatı", "Tarih", "Coğrafya", "Felsefe", "Psikoloji", "Sosyoloji", "Mantık", "Din Kültürü", "İngilizce", "Matematik|matematik", "YKS-TYT", "YKS-AYT"]),
  "lise:dil": S(["İngilizce", "Almanca", "Fransızca", "İspanyolca", "Türk Dili ve Edebiyatı", "Tarih", "Coğrafya", "Felsefe", "Matematik|matematik", "YDT", "YKS-TYT"]),
  "lise:henuz": S(["Matematik|matematik", "Fizik|fizik", "Kimya|kimya", "Biyoloji|biyoloji", "Türk Dili ve Edebiyatı", "Tarih", "Coğrafya", "İngilizce", "Felsefe", "Bilişim Teknolojileri"]),
  bilgisayar: S(["Programlama", "Veri Yapıları", "Algoritmalar", "Matematik 1|matematik", "Ayrık Matematik|matematik", "Lineer Cebir|matematik", "Fizik 1|fizik", "Veritabanı", "İşletim Sistemleri", "Bilgisayar Ağları", "Yapay Zekâ", "Web Geliştirme"]),
  elektrik: S(["Devre Analizi|fizik", "Elektromanyetik|fizik", "Sinyaller ve Sistemler|matematik", "Sayısal Tasarım", "Mikroişlemciler", "Gömülü Sistemler", "Analiz|matematik", "Diferansiyel Denklemler|matematik", "Fizik 1|fizik", "Programlama"]),
  makine: S(["Statik|fizik", "Dinamik|fizik", "Termodinamik|fizik", "Akışkanlar Mekaniği|fizik", "Malzeme Bilimi|kimya", "Analiz|matematik", "Lineer Cebir|matematik", "Teknik Resim", "Üretim Yöntemleri", "İşletme"]),
  insaat: S(["Statik|fizik", "Mukavemet|fizik", "Yapı Malzemesi|kimya", "Analiz|matematik", "Zemin Mekaniği", "Mimari Tasarım", "Teknik Resim", "Fizik 1|fizik", "Yapı Bilgisi"]),
  tip: S(["Anatomi|anatomi", "Fizyoloji|anatomi", "Histoloji|anatomi", "Hücre Biyolojisi|biyoloji", "Biyokimya|kimya", "Farmakoloji", "Patoloji", "Mikrobiyoloji|biyoloji", "Genel Kimya|kimya", "Biyoistatistik|matematik"]),
  saglik: S(["Anatomi|anatomi", "Fizyoloji|anatomi", "Farmakoloji", "Genel Kimya|kimya", "Organik Kimya|kimya", "Hücre Biyolojisi|biyoloji", "Hemşirelik Esasları", "Mikrobiyoloji|biyoloji", "Biyoistatistik|matematik"]),
  fen: S(["Matematik 1|matematik", "Analiz|matematik", "Lineer Cebir|matematik", "Diferansiyel Denklemler|matematik", "Fizik 1|fizik", "Mekanik|fizik", "Elektrik ve Manyetizma|fizik", "Kuantum Fiziği|fizik", "İstatistik|matematik", "Genel Kimya|kimya"]),
  kimbiyo: S(["Genel Kimya|kimya", "Organik Kimya|kimya", "Analitik Kimya|kimya", "Biyokimya|kimya", "Hücre Biyolojisi|biyoloji", "Genetik|biyoloji", "Moleküler Biyoloji|biyoloji", "Mikrobiyoloji|biyoloji", "Anatomi|anatomi", "Matematik 1|matematik", "Fizik 1|fizik"]),
  isletme: S(["İktisada Giriş", "Mikroekonomi", "Makroekonomi", "Muhasebe", "Finans", "Pazarlama", "İstatistik|matematik", "Matematik 1|matematik", "Yönetim", "Ekonometri|matematik"]),
  sosyal: S(["Hukukun Temel Kavramları", "Anayasa Hukuku", "Medeni Hukuk", "Ceza Hukuku", "Psikolojiye Giriş", "Sosyoloji", "Felsefe", "İstatistik|matematik", "Siyaset Bilimi"]),
  egitim: S(["Eğitim Bilimine Giriş", "Gelişim Psikolojisi", "Öğretim İlke ve Yöntemleri", "Matematik 1|matematik", "Fizik 1|fizik", "Genel Kimya|kimya", "Biyoloji|biyoloji", "Türkçe", "İngilizce", "Ölçme ve Değerlendirme"]),
  diger: S(["Matematik 1|matematik", "Fizik 1|fizik", "Genel Kimya|kimya", "Anatomi|anatomi", "Biyoloji|biyoloji", "İstatistik|matematik", "Programlama", "İngilizce", "Felsefe", "Tarih", "Psikoloji"]),
};

export type Profile = { level: LevelId | null; track: string | null; dept: string | null };

export const needsTrack = (l: LevelId | null) => l === "lise";
export const needsDept = (l: LevelId | null) => l === "onlisans" || l === "lisans" || l === "yuksek";

export function subjectsFor(p: Profile): Subject[] {
  if (p.level === "ilkokul") return SUBJECTS.ilkokul;
  if (p.level === "ortaokul") return SUBJECTS.ortaokul;
  if (p.level === "lise") return SUBJECTS[`lise:${p.track ?? "henuz"}`] ?? SUBJECTS["lise:henuz"];
  return SUBJECTS[p.dept ?? "diger"] ?? SUBJECTS.diger;
}

export const labelOf = (list: Option[], id: string | null) => list.find((o) => o.id === id)?.label ?? "";
