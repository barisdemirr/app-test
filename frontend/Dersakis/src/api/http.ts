import * as SecureStore from "expo-secure-store";
import { API } from "@/config";

const TOKEN_KEY = "token";

/** Sunucu hatası: `code` = ProblemDetails.title (makine okunur), `message` = Türkçe detail. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public data?: any,
    public retryAfter?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ---- token (bellekte + SecureStore'da) ----
let token: string | null = null;

export async function loadToken(): Promise<string | null> {
  try {
    token = await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    token = null;
  }
  return token;
}

export async function setToken(t: string | null): Promise<void> {
  token = t;
  try {
    if (t) await SecureStore.setItemAsync(TOKEN_KEY, t);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // SecureStore yazılamasa da bellekteki token ile devam edilir
  }
}

export const getToken = () => token;

// ---- 401 olayı: tek yerde yayınlanır, kök gezinti girişe götürür ----
type Listener = () => void;
const sessionExpiredListeners = new Set<Listener>();
export const onSessionExpired = (fn: Listener) => {
  sessionExpiredListeners.add(fn);
  return () => {
    sessionExpiredListeners.delete(fn);
  };
};

const safeJson = (t: string) => {
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
};

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** "(idem)" olan uçlar için zorunlu */
  idemKey?: string;
  signal?: AbortSignal;
};

/** Sorgu parametresi üretir; dizi değerler tekrarlanır (courseIds=A&courseIds=B), null/undefined atlanır. */
export function qs(params: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v)) {
      v.forEach((x) => parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(x))}`));
    } else {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    }
  }
  return parts.length ? `?${parts.join("&")}` : "";
}

export async function api<T = any>(path: string, o: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (o.idemKey) headers["Idempotency-Key"] = o.idemKey;

  let body: string | undefined;
  if (o.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(o.body);
  }

  let res: Response;
  try {
    res = await fetch(API + path, {
      method: o.method ?? "GET",
      headers,
      body,
      signal: o.signal,
    });
  } catch (e: any) {
    if (e?.name === "AbortError") throw e;
    throw new ApiError(
      0,
      "network_error",
      "Sunucuya ulaşılamadı. İnternet bağlantını kontrol et.",
    );
  }

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (res.status === 401 && token) {
    await setToken(null);
    sessionExpiredListeners.forEach((f) => f());
  }

  if (!res.ok) {
    const retry = Number(res.headers.get("Retry-After")) || undefined;
    throw new ApiError(
      res.status,
      data?.title ?? "unknown_error",
      data?.detail ?? "İstek başarısız oldu.",
      data,
      retry,
    );
  }
  return data as T;
}
