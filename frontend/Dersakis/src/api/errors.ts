import { ApiError } from "./http";

/** Kullanıcıya gösterilecek mesaj: sunucunun Türkçe `detail`'i, yoksa genel mesaj. */
export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  return "Bir sorun oluştu. Lütfen tekrar dene.";
}

export const errorCode = (e: unknown): string | null =>
  e instanceof ApiError ? e.code : null;
