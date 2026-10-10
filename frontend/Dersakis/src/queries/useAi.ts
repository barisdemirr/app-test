import { useMutation } from "@tanstack/react-query";
import { sendAiChat, type AiTurn } from "@/api/ai";

/** Her gönderimde tüm konuşma geçmişi gider; sunucu son N mesajı kullanır. */
export function useAiChat() {
  return useMutation({
    mutationFn: (messages: AiTurn[]) => sendAiChat(messages),
    retry: false,
  });
}
