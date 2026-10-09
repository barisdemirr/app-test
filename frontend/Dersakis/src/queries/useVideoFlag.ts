import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setVideoFlag, type VideoFlagKind } from "@/api/videos";
import { patchFeedItem } from "./feedCache";

const field = (k: VideoFlagKind) => (k === "save" ? "saved" : "learned");

/** Kaydet / Öğrendim: optimistic, hata olursa geri alır. */
export function useVideoFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; kind: VideoFlagKind; active: boolean }) =>
      setVideoFlag(v.id, v.kind, v.active),
    onMutate: (v) => patchFeedItem(qc, v.id, { [field(v.kind)]: v.active }),
    onError: (_e, v) => patchFeedItem(qc, v.id, { [field(v.kind)]: !v.active }),
  });
}
