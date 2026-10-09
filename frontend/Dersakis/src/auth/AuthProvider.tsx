import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ApiError, loadToken, onSessionExpired, setToken } from "@/api/http";
import { fetchMe, type AuthResponse, type AuthUser } from "@/api/auth";
import { runSignOutHooks } from "./session";

export type AuthStatus = "loading" | "signedOut" | "signedIn" | "offline";

type AuthState = { status: AuthStatus; user: AuthUser | null };

export type AuthContextValue = AuthState & {
  /** register/login cevabıyla oturum aç */
  signIn: (res: AuthResponse) => Promise<void>;
  signOut: () => Promise<void>;
  /** açılışta sunucuya ulaşılamadıysa tekrar dene */
  retry: () => Promise<void>;
  updateUser: (patch: Partial<AuthUser>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading", user: null });

  const boot = useCallback(async () => {
    setState({ status: "loading", user: null });
    const t = await loadToken();
    if (!t) {
      setState({ status: "signedOut", user: null });
      return;
    }
    try {
      const user = await fetchMe();
      setState({ status: "signedIn", user });
    } catch (e) {
      // Yalnızca 401 oturumu bitirir. Ağ, 5xx, 429... geçici sorundur: token'ı SİLME,
      // kullanıcı yeniden deneyebilsin (rapor 6.1).
      if (e instanceof ApiError && e.status === 401) {
        await setToken(null);
        setState({ status: "signedOut", user: null });
      } else {
        setState({ status: "offline", user: null });
      }
    }
  }, []);

  useEffect(() => {
    boot();
  }, [boot]);

  // 401: api istemcisi token'ı zaten sildi; kök gezinti girişe döner.
  useEffect(
    () => onSessionExpired(() => setState({ status: "signedOut", user: null })),
    [],
  );

  const signIn = useCallback(async (res: AuthResponse) => {
    await setToken(res.accessToken);
    setState({ status: "signedIn", user: res.user });
  }, []);

  const signOut = useCallback(async () => {
    await runSignOutHooks();
    await setToken(null);
    setState({ status: "signedOut", user: null });
  }, []);

  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    setState((s) => (s.user ? { ...s, user: { ...s.user, ...patch } } : s));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, signIn, signOut, retry: boot, updateUser }),
    [state, signIn, signOut, boot, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
