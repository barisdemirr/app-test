import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/api/http";
import { onSessionExpired } from "@/api/http";
import { onSignOut } from "@/auth/session";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // 4xx kesin cevaptır, tekrar denemenin anlamı yok; ağ/5xx için en çok 2 deneme
      retry: (count, e) =>
        !(e instanceof ApiError && e.status >= 400 && e.status < 500) && count < 2,
    },
  },
});

// Önceki kullanıcının verisi bir sonrakine sızmasın: çıkışta VE 401'de önbelleği temizle.
onSignOut(() => queryClient.clear());
onSessionExpired(() => queryClient.clear());
