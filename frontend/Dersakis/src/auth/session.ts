/**
 * Çıkışta çalışacak temizlik adımları. Diğer modüller (cihaz kaydı, sorgu önbelleği,
 * Agora motoru...) kendini buraya kaydeder; auth bunları bilmek zorunda kalmaz.
 * Adımlar token SİLİNMEDEN ÖNCE, kayıt sırasıyla çalışır; birinin hatası diğerlerini durdurmaz.
 */
type Hook = () => void | Promise<void>;
const hooks = new Set<Hook>();

export const onSignOut = (fn: Hook) => {
  hooks.add(fn);
  return () => {
    hooks.delete(fn);
  };
};

export async function runSignOutHooks(): Promise<void> {
  for (const fn of Array.from(hooks)) {
    try {
      await fn();
    } catch {
      // temizlik hatası çıkışı engellemez
    }
  }
}
