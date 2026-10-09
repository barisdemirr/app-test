import { useEffect, useState } from "react";

/** Arama kutusu için: her tuşta değil, yazmayı bırakınca sorgula (sunucu araması). */
export function useDebounced<T>(value: T, ms = 350): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
