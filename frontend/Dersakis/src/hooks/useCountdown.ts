import { useCallback, useEffect, useState } from "react";

/** Saniye cinsinden geri sayım (tekrar gönder kilidi, hesap kilidi vb.). */
export function useCountdown() {
  const [until, setUntil] = useState(0);
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (!until) {
      setLeft(0);
      return;
    }
    const tick = () => {
      const l = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      setLeft(l);
      if (l <= 0) clearInterval(id);
    };
    const id = setInterval(tick, 500);
    tick();
    return () => clearInterval(id);
  }, [until]);

  const start = useCallback((seconds: number) => setUntil(Date.now() + seconds * 1000), []);
  return { left, start };
}
