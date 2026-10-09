import { useEffect, useState } from "react";
import { AppState } from "react-native";

/** Uygulama ön planda mı? Arka planda video duraklatılır, heartbeat durur. */
export function useAppForeground(): boolean {
  const [active, setActive] = useState(AppState.currentState === "active");
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => setActive(s === "active"));
    return () => sub.remove();
  }, []);
  return active;
}
