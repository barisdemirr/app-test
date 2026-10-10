/**
 * Ders adları (/courses: "Matematik 1", "Genel Kimya", "Hücre Biyolojisi") ile Bilene Sor kategorileri
 * (/qa/config: "Matematik", "Kimya", "Biyoloji", "Diğer") AYNI DEĞİLDİR. Soru listesi kategoriye göre
 * süzüldüğü için ders adını doğrudan göndermek soruları görünmez yapıyordu. Bu eşleme ikisini bağlar.
 */
const norm = (s: string) =>
  s
    .toLocaleLowerCase("tr")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();

export const QA_OTHER = "Diğer";

/** Bir dersin Bilene Sor kategorisi (yoksa null). Örn. "Genel Kimya" → "Kimya". */
export function qaCategoryOfCourse(course: string, categories: string[]): string | null {
  const c = norm(course);
  if (!c) return null;
  const hit = categories.find((k) => {
    const n = norm(k);
    return n && n !== norm(QA_OTHER) && (c.includes(n) || n.includes(c));
  });
  return hit ?? null;
}

/**
 * Seçili derslerin soru kategorileri. `includeOther`: "Diğer" her zaman dahil (hiçbir derse bağlanmayan
 * sorular da görünsün). Ders seçili değilse tüm kategoriler döner.
 */
export function qaCategoriesFor(
  courses: string[],
  categories: string[],
  includeOther = true,
): string[] {
  if (categories.length === 0) return [];
  if (courses.length === 0) return categories;
  const out: string[] = [];
  for (const course of courses) {
    const k = qaCategoryOfCourse(course, categories);
    if (k && !out.includes(k)) out.push(k);
  }
  const other = categories.find((k) => norm(k) === norm(QA_OTHER));
  if (includeOther && other && !out.includes(other)) out.push(other);
  return out.length > 0 ? out : categories;
}
