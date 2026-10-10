/**
 * Sunucu tarihleri bazen `Z`'siz gelir (2026-10-09T15:00:00.123); JS bunu yerel saat sanır
 * ve Türkiye'de 3 saat kayar. Her tarihi bu fonksiyonla çöz.
 */
export const toDate = (s: string): Date =>
  new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : s + "Z");

/** Sunucuya gönderirken her zaman Z'li ISO. */
export const toIso = (d: Date): string => d.toISOString();

/**
 * Telefon saati yanlış olabilir: geri sayımlar `serverNowUtc` ile istemci saati
 * farkı üzerinden yapılır. Her yeni oturum cevabında yeniden oluştur.
 */
export function makeServerClock(serverNowUtc: string) {
  const offset = toDate(serverNowUtc).getTime() - Date.now();
  return {
    now: () => Date.now() + offset,
    remainingMs: (deadlineUtc: string) =>
      toDate(deadlineUtc).getTime() - (Date.now() + offset),
  };
}

/** 125000 ms -> "2:05" */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export const formatDateTime = (s: string): string =>
  toDate(s).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Uzun geri sayım: 3:05:09 (saatli) ya da 12:30. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad2(m)}:${pad2(s)}` : `${m}:${pad2(s)}`;
}

/** İnsan okunur kalan süre: "2 gün 3 sa", "3 sa 12 dk", "12 dk", "40 sn". */
export function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (d > 0) return h > 0 ? `${d} gün ${h} sa` : `${d} gün`;
  if (h > 0) return m > 0 ? `${h} sa ${m} dk` : `${h} sa`;
  if (m > 0) return `${m} dk`;
  return `${Math.max(1, total)} sn`;
}

const DAY_MS = 86_400_000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** "Bugün 18:30", "Yarın 14:00", "Pzt 12 Eki · 14:00". */
export function formatWhen(iso: string, nowMs: number = Date.now()): { day: string; time: string } {
  const d = toDate(iso);
  const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  const diff = Math.round((startOfDay(d) - startOfDay(new Date(nowMs))) / DAY_MS);
  if (diff === 0) return { day: "Bugün", time };
  if (diff === 1) return { day: "Yarın", time };
  const day = d.toLocaleDateString("tr-TR", { weekday: "short", day: "numeric", month: "short" });
  return { day, time };
}
