import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import {
  chooseBestAnswer,
  createQaAnswer,
  createQaQuestion,
  editQaAnswer,
  fetchQaConfig,
  fetchQaQuestion,
  fetchQaQuestions,
  type QaQuestion,
  type QaStatus,
} from "@/api/qa";
import type { BalanceDto } from "@/api/credits";
import type { CursorPage } from "@/api/types";
import { useIdemAction } from "@/hooks/useIdemAction";
import { queryKeys } from "./keys";

type Cursor = number | string | undefined;

/** Fiyat/ödül/kategori sabit yazılmaz; buradan gelir. */
export function useQaConfig() {
  return useQuery({
    queryKey: queryKeys.qaConfig,
    queryFn: fetchQaConfig,
    staleTime: 5 * 60_000,
  });
}

export function useQaQuestions(o: {
  categories: string[];
  search?: string;
  status?: QaStatus;
  limit?: number;
  enabled?: boolean;
}) {
  const { categories, search = "", status = "all", limit = 10, enabled = true } = o;
  return useInfiniteQuery({
    queryKey: queryKeys.qaList(categories, status, search, limit),
    enabled: enabled && categories.length > 0,
    initialPageParam: undefined as Cursor,
    queryFn: ({ pageParam }) =>
      fetchQaQuestions({ categories, status, search, limit, cursor: pageParam }),
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

export function flattenQa(data?: InfiniteData<CursorPage<QaQuestion>>): QaQuestion[] {
  const seen = new Set<string>();
  const out: QaQuestion[] = [];
  for (const p of data?.pages ?? [])
    for (const q of p.items)
      if (!seen.has(q.id)) {
        seen.add(q.id);
        out.push(q);
      }
  return out;
}

export function useQaQuestion(id: string) {
  return useQuery({
    queryKey: queryKeys.qaDetail(id),
    queryFn: () => fetchQaQuestion(id),
    staleTime: 0,
  });
}

const patchBalance = (qc: ReturnType<typeof useQueryClient>, balance: number) =>
  qc.setQueryData<BalanceDto>(queryKeys.balance, (b) => (b ? { ...b, balance } : b));

export function useAskQuestion() {
  const qc = useQueryClient();
  const act = useIdemAction((a: { category: string; topic: string; text: string }, key) =>
    createQaQuestion(a, key),
  );
  return useMutation({
    mutationFn: act,
    onSuccess: (r) => {
      patchBalance(qc, r.balance);
      qc.invalidateQueries({ queryKey: queryKeys.qa });
    },
  });
}

export function useAnswerQa(questionId: string) {
  const qc = useQueryClient();
  const act = useIdemAction((text: string, key) => createQaAnswer(questionId, text, key));
  return useMutation({
    mutationFn: act,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.qa }),
  });
}

export function useEditAnswer(questionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { answerId: string; text: string }) => editQaAnswer(v.answerId, v.text),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.qaDetail(questionId) }),
  });
}

export function useChooseBest(questionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (answerId: string) => chooseBestAnswer(questionId, answerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.qa }),
  });
}
