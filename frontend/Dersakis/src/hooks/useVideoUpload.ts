import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/api/http";
import {
  createVideoDraft,
  uploadVideoContent,
  type NewVideo,
  type VideoPublished,
} from "@/api/videos";
import { newKey } from "@/utils/idempotency";

export type UploadPhase = "idle" | "creating" | "uploading";

/**
 * İki adımlı yükleme: POST /videos (taslak) → PUT /videos/{id}/content.
 * - Adım 1 aynı gövdeyle tekrarlanmaz: taslak id'si saklanır, yeniden denemede yalnızca adım 2 gider.
 * - Adım 1 ağ hatasıyla kopmuşsa aynı Idempotency-Key ile tekrarlanır (çift taslak oluşmaz).
 * - Form değişirse (parmak izi farklı) yeni taslak açılır.
 */
export function useVideoUpload() {
  const qc = useQueryClient();
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [progress, setProgress] = useState(0);
  const draft = useRef<{ id: string; fp: string } | null>(null);
  const pendingKey = useRef<{ key: string; fp: string } | null>(null);

  const run = useCallback(
    async (body: NewVideo, fileUri: string): Promise<VideoPublished> => {
      const fp = JSON.stringify(body);
      setProgress(0);
      try {
        if (!draft.current || draft.current.fp !== fp) {
          setPhase("creating");
          if (!pendingKey.current || pendingKey.current.fp !== fp)
            pendingKey.current = { key: newKey(), fp };
          try {
            const d = await createVideoDraft(body, pendingKey.current.key);
            draft.current = { id: d.id, fp };
            pendingKey.current = null;
          } catch (e) {
            // Kesin ret (4xx): sunucu işlem yapmadı → bir sonraki denemede yeni anahtar.
            if (
              e instanceof ApiError &&
              e.status >= 400 &&
              e.status < 500 &&
              e.code !== "request_in_progress"
            )
              pendingKey.current = null;
            throw e;
          }
        }
        setPhase("uploading");
        const res = await uploadVideoContent(draft.current.id, fileUri, setProgress);
        draft.current = null;
        qc.invalidateQueries({ queryKey: ["feed"] });
        return res;
      } catch (e) {
        // Taslak yok/süresi dolmuşsa yeniden oluşturulsun
        if (e instanceof ApiError && ["video_not_found", "draft_unavailable"].includes(e.code))
          draft.current = null;
        throw e;
      } finally {
        setPhase("idle");
      }
    },
    [qc],
  );

  return { phase, progress, busy: phase !== "idle", run };
}
