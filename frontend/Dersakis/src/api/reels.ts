import { initialReels, FACT } from "@/mocks";
import type { Reel } from "@/types";
import { request } from "./client";

/**
 * Tüm reels'i çeker.
 * GET /reels
 */
export async function fetchReels(): Promise<Reel[]> {
  return request<Reel[]>("/reels", initialReels);
}

/**
 * Derslere göre filtrelenmiş reels.
 * GET /reels?courses=Matematik%201,Fizik%201
 *
 * Backend tarafı filtrelemeyi yapacak, ama şimdilik client'ta filtreliyoruz.
 */
export async function fetchReelsForCourses(
  selectedCourses: string[],
): Promise<Reel[]> {
  const all = await fetchReels();
  return all.filter(
    (r) => r.course === FACT || selectedCourses.includes(r.course),
  );
}

/**
 * Bir reel'i kaydet.
 * POST /reels/:id/save
 */
export async function saveReel(id: string): Promise<{ id: string; saved: true }> {
  return request(`/reels/${id}/save`, { id, saved: true }, { method: "POST" });
}

/**
 * Bir reel'i kaydetmekten çıkar.
 * DELETE /reels/:id/save
 */
export async function unsaveReel(
  id: string,
): Promise<{ id: string; saved: false }> {
  return request(
    `/reels/${id}/save`,
    { id, saved: false },
    { method: "DELETE" },
  );
}

/**
 * Bir reel'e "öğrendim" işareti.
 * POST /reels/:id/learn
 */
export async function markReelLearned(
  id: string,
): Promise<{ id: string; learned: true }> {
  return request(
    `/reels/${id}/learn`,
    { id, learned: true },
    { method: "POST" },
  );
}

/**
 * Yeni bir reel yayınla (içerik üret).
 * POST /reels
 */
export async function createReel(input: Reel): Promise<Reel> {
  return request<Reel>("/reels", input, { method: "POST" });
}