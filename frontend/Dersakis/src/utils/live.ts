import type { LiveOutcome, LiveSessionDto, LiveStatus } from "@/api/types";
import { toDate } from "./time";

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
      return 10000;
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
      return "Katılım bekleniyor";
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
      return payer
        ? "İlan sahibi/eğitmen gelmedi, kredin iade edildi."
        : "Zamanında katılmadığın için iptal edildi.";
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
