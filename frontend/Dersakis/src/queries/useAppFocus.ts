import { useEffect } from "react";
import { AppState } from "react-native";
import { focusManager } from "@tanstack/react-query";

/**
 * Uygulama öne gelince react-query'ye haber verir: bayat sorgular (bakiye dahil) yeniden çekilir.
 * Bakiye arka planda değişebilir (iade, kazanç, otomatik onay), bu yüzden gerekli.
 */
export function useAppFocus() {
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => focusManager.setFocused(s === "active"));
    return () => sub.remove();
  }, []);
}
