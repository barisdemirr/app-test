import type { LiveOutcome, LiveSessionDto, LiveStatus } from "@/api/types";
import { formatRemaining, toDate } from "./time";

/** Kredi ödeyen taraf: sesli → ilan sahibi, eğitim → öğrenci. */
export const isPayer = (s: LiveSessionDto) =>
  (s.kind === "Voice" && s.myRole === "host") || (s.kind === "Lesson" && s.myRole === "guest");

export const canReview = (s: LiveSessionDto) => s.status === "AwaitingApproval" && isPayer(s);

export const canEnd = (s: LiveSessionDto) => s.status === "Live" && s.myRole !== "none";

export const canCancel = (s: LiveSessionDto, serverNowMs: number) =>
  s.myRole === "host" &&
  (s.status === "Open" ||
    s.status === "Listed" ||
    (s.status === "Booked" && !!s.scheduledAtUtc && toDate(s.scheduledAtUtc).getTime() > serverNowMs));

export const isFinal = (st: LiveStatus) =>
  st === "Completed" || st === "Cancelled" || st === "Expired";

/** Rapor 7.4: ekran durumuna göre yoklama aralığı (ms). false = durdur. */
export function pollInterval(s?: LiveSessionDto): number | false {
  if (!s) return 5000;
  // Randevuya 2 dk kala sık yokla: Booked → Waiting geçişi ve Katıl düğmesi hemen görünsün
  if (s.status === "Booked" && s.scheduledAtUtc) {
    const left = toDate(s.scheduledAtUtc).getTime() - Date.now();
    if (left < 120_000) return 2000;
  }
  switch (s.status) {
    case "Open":
      return 4000;
    case "Pending":
    case "Waiting":
      return 3000;
    case "Live":
      return 5000;
    case "Listed":
    case "Booked":
    case "AwaitingApproval":
      return 8000;
    default:
      return false;
  }
}

export const statusLabel = (s: LiveSessionDto): string => {
  switch (s.status) {
    case "Open":
      return "Katılım bekleniyor";
    case "Listed":
      return "Satışta";
    case "Booked":
      return "Randevu bekleniyor";
    case "Pending":
      return s.myRole === "host"
        ? "Seni bekliyor, katıl"
        : s.myRole === "guest"
          ? "İlan sahibi bekleniyor"
          : "Katılım bekleniyor";
    case "Waiting":
      return "Katılma zamanı";
    case "Live":
      return "Görüşme sürüyor";
    case "AwaitingApproval":
      return "Değerlendirme bekleniyor";
    case "Completed":
      return "Tamamlandı";
    case "Cancelled":
      return "İptal edildi";
    case "Expired":
      return "Süresi doldu";
  }
};

/** Rapor 7.5: sonuç metinleri (ödeyen / kazanan ayrımıyla). */
export function outcomeText(s: LiveSessionDto): string | null {
  const o: LiveOutcome = s.outcome;
  if (o === "None") return null;
  const payer = isPayer(s);
  const amount = s.kind === "Voice" ? s.payout : s.price;
  switch (o) {
    case "Approved":
      return payer ? "Onayladın." : `Kredin hesabına geçti (+${amount}).`;
    case "AutoApproved":
      return payer ? "Süre dolduğu için onaylandı." : `Kredin hesabına geçti (+${amount}).`;
    case "Rejected":
      return payer
        ? "Kredin iade edildi."
        : "Karşı taraf memnun kalmadı, kredi verilmedi.";
    case "HostNoShow":
      // Gelmeyen taraf HER ZAMAN host'tur (sesli: soran, eğitim: eğitmen)
      if (s.myRole === "host")
        return s.kind === "Voice"
          ? "Zamanında katılmadığın için iptal edildi, kredin iade edildi."
          : "Zamanında katılmadığın için iptal edildi.";
      return s.kind === "Voice"
        ? "İlan sahibi zamanında gelmedi, görüşme iptal edildi."
        : "Eğitmen gelmedi, kredin iade edildi.";
    case "GuestNoShow":
      return payer
        ? "Katılmadığın için ücret iade edilmedi."
        : `Öğrenci gelmediği için ücret hesabına geçti (+${amount}).`;
    case "BothNoShow":
      return "Kimse katılmadığı için iptal, iade edildi.";
    case "NoGuest":
      return s.kind === "Voice" ? "Kimse katılmadı, iade edildi." : "Eğitimin satılmadı.";
  }
}


export type LiveCta = {
  kind: "book" | "answer" | "join" | "rejoin" | "wait" | "review" | "none";
  label: string;
  /** Pasif düğmenin altına yazılacak açıklama */
  hint?: string;
  enabled: boolean;
};

/**
 * Bir oturum için "şimdi yapılacak tek şey". Kart, şerit ve oturum ekranı aynı kuralı kullanır;
 * böylece Katıl düğmesi hiçbir yerde kaybolmaz: katılamıyorsan neden ve ne zaman olacağı yazar.
 * `canJoin` / `canBook` sunucudan gelir, istemci tahmin yürütmez; `serverNowMs` yalnızca metin içindir.
 */
export function primaryCta(s: LiveSessionDto, serverNowMs: number): LiveCta {
  const lesson = s.kind === "Lesson";
  if (s.canBook) return { kind: "book", label: `Satın al · ${s.price} ✦`, enabled: true };
  if (s.canJoin) {
    if (s.kind === "Voice" && s.myRole === "none")
      return { kind: "answer", label: `Cevapla · +${s.payout} ✦`, enabled: true };
    return { kind: "join", label: lesson ? "Eğitime katıl" : "Görüşmeye katıl", enabled: true };
  }
  if (s.myRole === "none") return { kind: "none", label: statusLabel(s), enabled: false };

  switch (s.status) {
    case "Live":
      return { kind: "rejoin", label: "Görüşmeye dön", enabled: true };
    case "Booked": {
      const left = s.scheduledAtUtc ? toDate(s.scheduledAtUtc).getTime() - serverNowMs : 0;
      return {
        kind: "wait",
        label: left > 0 ? `Katıl · ${formatRemaining(left)} sonra` : "Katıl · açılıyor…",
        hint: "Randevu saati gelince bu düğme otomatik açılır.",
        enabled: false,
      };
    }
    case "Waiting":
      return {
        kind: "wait",
        label: "Katıl · açılıyor…",
        hint: "Birkaç saniye içinde açılır.",
        enabled: false,
      };
    case "Pending":
      return s.myRole === "guest"
        ? { kind: "wait", label: "İlan sahibi bekleniyor", enabled: false }
        : { kind: "wait", label: "Katıl · açılıyor…", enabled: false };
    case "AwaitingApproval":
      return canReview(s)
        ? { kind: "review", label: "Değerlendir", enabled: true }
        : { kind: "wait", label: "Değerlendirme bekleniyor", enabled: false };
    default:
      return { kind: "none", label: statusLabel(s), enabled: false };
  }
}

/** Zaman çizelgesi (oturum ekranı): adım adları ve şu anki adımın indeksi. */
export function timelineOf(s: LiveSessionDto): { steps: string[]; current: number; failed: boolean } {
  const lesson = s.kind === "Lesson";
  const steps = lesson
    ? ["Satın alındı", "Randevu", "Görüşme", "Değerlendirme"]
    : ["İlan", "Katılım", "Görüşme", "Değerlendirme"];
  const failed = s.status === "Cancelled" || s.status === "Expired";
  let current = 0;
  switch (s.status) {
    case "Open":
    case "Listed":
      current = 0;
      break;
    case "Booked":
    case "Pending":
      current = 1;
      break;
    case "Waiting":
      current = 1;
      break;
    case "Live":
      current = 2;
      break;
    case "AwaitingApproval":
      current = 3;
      break;
    case "Completed":
      current = 4;
      break;
    default:
      current = lesson && s.outcome === "None" ? 0 : 1;
  }
  return { steps, current, failed };
}
