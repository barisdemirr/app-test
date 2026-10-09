import { sleep } from "@/utils";

/**
 * Request helper.
 * Currently mocked: sleeps ~1s and returns the payload.
 *
 * When the backend is ready, replace the body with a real fetch():
 *
 *   const res = await fetch(`${BASE_URL}${path}`, {
 *     method,
 *     headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
 *     body: body ? JSON.stringify(body) : undefined,
 *   });
 *   if (!res.ok) throw new ApiError(res.status, await res.text());
 *   return res.json();
 */

export const API_BASE_URL = "https://api.dersakis.example"; // TODO: real URL
const MOCK_DELAY_MS = 1000;

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  /** ms cinsinden gecikme override (test için) */
  delay?: number;
};

export async function request<T>(
  path: string,
  payload: unknown,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", delay = MOCK_DELAY_MS } = options;

  if (__DEV__) {
    console.log(`[api] → ${method} ${path}`, payload ?? "");
  }

  await sleep(delay);

  if (__DEV__) {
    console.log(`[api] ← ${method} ${path}`, payload ?? "");
  }

  // Mock: payload'u döner. Backend gelince burada fetch çağrısı olacak.
  return payload as T;
}