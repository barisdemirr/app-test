/** Boşluk, parantez, tire gibi karakterleri temizler (başındaki + kalır). */
export const cleanPhone = (s: string): string => s.replace(/[^\d+]/g, "");

/**
 * Türkiye cep numarası: 05xx..., 5xx..., +90 5xx... biçimlerini kabul eder.
 * Asıl normalizasyon sunucudadır; bu yalnızca erken geri bildirim içindir.
 */
export const isValidTrMobile = (s: string): boolean => {
  const local = cleanPhone(s).replace(/^(\+?90|0)/, "");
  return /^5\d{9}$/.test(local);
};
