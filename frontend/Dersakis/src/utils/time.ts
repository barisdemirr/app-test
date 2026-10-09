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
