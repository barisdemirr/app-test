import type { FeedItem } from "@/api/feed";
import { FACTS, type Fact } from "@/constants/facts";

export type FeedRow =
  | { kind: "video"; key: string; item: FeedItem }
  | { kind: "fact"; key: string; fact: Fact };

/** Her N videodan sonra, kullanıcının ilgi alanlarına uyan bir "Biliyor muydun?" kartı ekler. */
export function buildRows(items: FeedItem[], interests: string[], every = 4): FeedRow[] {
  const facts = FACTS.filter((f) => interests.includes(f.interest));
  const rows: FeedRow[] = [];
  let n = 0;
  items.forEach((item, i) => {
    rows.push({ kind: "video", key: `v:${item.id}`, item });
    if (facts.length && (i + 1) % every === 0) {
      const fact = facts[n % facts.length];
      rows.push({ kind: "fact", key: `f:${fact.id}:${n}`, fact });
      n++;
    }
  });
  return rows;
}
