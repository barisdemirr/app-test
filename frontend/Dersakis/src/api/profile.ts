import { api } from "./http";
import { uploadRaw } from "./upload";

export type ProfileDto = {
  id: string;
  phone: string;
  displayName: string;
  about: string | null;
  /** Göreli yol (?v=... içerir, silme); yoksa null → baş harfler */
  avatarUrl: string | null;
  creditBalance: number;
  inviteCode: string;
  createdAtUtc: string;
  /** Yayınladığın video sayısı ve videolarına verilen "Öğrendim" toplamı */
  content: { videos: number; learnedByOthers: number };
};

export const fetchProfile = () => api<ProfileDto>("/me/profile");

/** PUT /me/profile — gönderilmeyen alan değişmez; about: "" temizler. */
export const updateProfile = (patch: { displayName?: string; about?: string }) =>
  api<ProfileDto>("/me/profile", { method: "PUT", body: patch });

/** PUT /me/avatar — ham görsel, en çok 2 MB; sunucu 256×256 kare WebP'e çevirir. */
export const uploadAvatar = (fileUri: string, mime = "image/jpeg") =>
  uploadRaw<{ avatarUrl: string | null }>("/me/avatar", fileUri, mime);

export const removeAvatar = () =>
  api<{ avatarUrl: string | null }>("/me/avatar", { method: "DELETE" });
