import { useEffect, useMemo, useState } from "react";
import { makeServerClock } from "@/utils/time";

/**
 * Sunucu saatine göre kalan süre (ms). Telefon saati yanlış olabilir, bu yüzden
 * her yeni oturum cevabındaki `serverNowUtc` farkı kullanılır (clock her cevapta yenilenir).
 */
export function useServerClock(serverNowUtc: string | undefined, updatedAt: number) {
  return useMemo(
    () => makeServerClock(serverNowUtc ?? new Date().toISOString()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [serverNowUtc, updatedAt],
  );
}

/** Her saniye yeniden çizim tetikler; `active` false ise durur. */
export function useTick(active = true) {
  const [, set] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => set((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
}
