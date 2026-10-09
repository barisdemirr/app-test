import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { fetchCreditHistory } from "@/api/credits";
import {
  fetchProfile,
  removeAvatar,
  updateProfile,
  uploadAvatar,
  type ProfileDto,
} from "@/api/profile";
import { fetchReferral } from "@/api/referrals";
import { useAuth } from "@/auth";
import { queryKeys } from "./keys";

export const useProfile = () =>
  useQuery({ queryKey: queryKeys.profile, queryFn: fetchProfile, staleTime: 0 });

export const useReferral = () =>
  useQuery({ queryKey: queryKeys.referral, queryFn: fetchReferral });

export function useCreditHistory() {
  return useInfiniteQuery({
    queryKey: queryKeys.creditHistory,
    staleTime: 0,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchCreditHistory(pageParam),
    getNextPageParam: (last, all) => (last.hasMore ? all.length + 1 : undefined),
  });
}

/** Ad değişince oturumdaki kullanıcı da güncellenir (ana sayfa selamı). */
export function useUpdateProfile() {
  const qc = useQueryClient();
  const { updateUser } = useAuth();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (p) => {
      qc.setQueryData<ProfileDto>(queryKeys.profile, p);
      updateUser({ displayName: p.displayName });
    },
  });
}

export function useAvatar() {
  const qc = useQueryClient();
  const setUrl = (avatarUrl: string | null) =>
    qc.setQueryData<ProfileDto>(queryKeys.profile, (p) => (p ? { ...p, avatarUrl } : p));
  return {
    upload: useMutation({
      mutationFn: (uri: string) => uploadAvatar(uri),
      onSuccess: (r) => setUrl(r.avatarUrl),
    }),
    remove: useMutation({
      mutationFn: removeAvatar,
      onSuccess: (r) => setUrl(r.avatarUrl),
    }),
  };
}
