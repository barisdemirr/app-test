import { useRef } from "react";
import { ApiError } from "@/api/http";
import { newKey } from "@/utils/idempotency";

/**
 * "(idem)" uçları için: anahtar eylem başına bir kez üretilir.
 * - Başarı: sonraki eylem yeni anahtar kullanır.
 * - Kesin ret (4xx, request_in_progress hariç): sunucu işlem yapmadı, yeni anahtar güvenli.
 * - Ağ hatası / 5xx / request_in_progress: anahtar korunur, "Tekrar dene" aynı anahtarla gider.
 */
export function useIdemAction<TArgs, TRes>(
  fn: (args: TArgs, key: string) => Promise<TRes>,
) {
  const keyRef = useRef<string | null>(null);
  const argsRef = useRef<string>("");
  return async (args: TArgs): Promise<TRes> => {
    // Kullanıcı formu değiştirip yeniden gönderirse gövde farklıdır: yeni anahtar (rapor 3.8/7).
    // Aynı anahtar farklı gövdeyle gitseydi sunucu 422 idempotency_key_reused dönerdi.
    const fp = JSON.stringify(args ?? null);
    if (fp !== argsRef.current) keyRef.current = null;
    argsRef.current = fp;
    keyRef.current ??= newKey();
    try {
      const r = await fn(args, keyRef.current);
      keyRef.current = null;
      argsRef.current = "";
      return r;
    } catch (e) {
      if (
        e instanceof ApiError &&
        e.status >= 400 &&
        e.status < 500 &&
        e.code !== "request_in_progress"
      ) {
        keyRef.current = null;
      }
      throw e;
    }
  };
}
