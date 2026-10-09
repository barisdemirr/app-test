/**
 * Uygulama yapılandırması.
 * Sır (JWT anahtarı, Agora sertifikası vb.) buraya ASLA konmaz.
 */
export const API_ORIGIN: string =
  process.env.EXPO_PUBLIC_API_ORIGIN ?? "http://192.168.1.20:5267";

export const API = `${API_ORIGIN}/api/v1`;

/** Sunucunun verdiği göreli yolu (örn. /api/v1/videos/{id}/stream) tam URL'ye çevirir. */
export const absoluteUrl = (path: string | null | undefined): string | null =>
  path ? `${API_ORIGIN}${path}` : null;
