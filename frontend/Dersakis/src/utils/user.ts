/** "Elif Yıldız" -> "EY" */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const a = parts[0][0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (a + b).toLocaleUpperCase("tr-TR");
}

const PALETTE = ["#7276F4", "#26B6C4", "#F29C72", "#59B890", "#C277AB", "#477CC6", "#DD8BB6", "#A289D6"];

/** Aynı kullanıcı her zaman aynı rengi alsın diye id'den türetilir. */
export function colorFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
