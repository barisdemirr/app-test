import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { answerQuestion, fetchQuiz } from "@/api/quiz";
import type { BalanceDto } from "@/api/credits";
import { queryKeys } from "./keys";

/** Şıklar her istekte karışır; bu yüzden önbellekte tutmuyoruz (gcTime 0). */
export function useQuiz(videoId: string) {
  return useQuery({
    queryKey: queryKeys.quiz(videoId),
    queryFn: () => fetchQuiz(videoId),
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
}

/** Cevap sonrası başlıktaki bakiye, cevaptaki `balance` ile güncellenir. */
export function useAnswerQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { questionId: string; optionId: string }) =>
      answerQuestion(v.questionId, v.optionId),
    onSuccess: (r) => {
      qc.setQueryData<BalanceDto>(queryKeys.balance, (b) =>
        b
          ? {
              ...b,
              balance: r.balance,
              dailyEarned: b.dailyEarned + r.creditAwarded,
              dailyRemaining: Math.max(0, b.dailyRemaining - r.creditAwarded),
            }
          : b,
      );
      // günlük tavan ve doğruluk oranı sunucudan taze gelsin
      qc.invalidateQueries({ queryKey: queryKeys.balance });
      qc.invalidateQueries({ queryKey: queryKeys.stats });
    },
  });
}
