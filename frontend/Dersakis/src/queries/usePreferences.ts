import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPreferences, savePreferences, type Preferences, type PreferencesInput } from "@/api/preferences";
import { queryKeys } from "./keys";

const MUTATION_KEY = ["updatePreferences"] as const;

export function usePreferences() {
  return useQuery({ queryKey: queryKeys.preferences, queryFn: fetchPreferences });
}

/** Optimistic güncelleme; hata olursa eski tercihe döner. */
export function useUpdatePreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: MUTATION_KEY,
    mutationFn: (input: PreferencesInput) => savePreferences(input),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: queryKeys.preferences });
      const prev = qc.getQueryData<Preferences>(queryKeys.preferences);
      qc.setQueryData<Preferences>(queryKeys.preferences, (old) =>
        old ? { ...old, ...input } : old,
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.preferences, ctx.prev);
    },
    onSuccess: (data) => {
      // Arka arkaya hızlı dokunuşlarda eski cevap yeni iyimser durumu ezmesin:
      // yalnızca son mutasyon bittiğinde sunucu cevabını yaz.
      if (qc.isMutating({ mutationKey: MUTATION_KEY }) <= 1) {
        qc.setQueryData(queryKeys.preferences, data);
      }
      // Ders seçimi feed / Bilene sor / canlı listeleri etkiler
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["qa"] });
      qc.invalidateQueries({ queryKey: ["live"] });
    },
  });
}
