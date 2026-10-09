/** Yükleme formunun istemci doğrulaması — sunucu sınırlarının aynısı (asıl kontrol sunucuda). */

export const LIMITS = {
  titleMin: 3,
  titleMax: 70,
  topicMin: 2,
  topicMax: 40,
  qMin: 5,
  qMax: 300,
  optMax: 150,
  expMax: 500,
  minDurationMs: 20_000,
  maxDurationMs: 120_000,
  maxBytes: 100 * 1024 * 1024,
};

export type PickedVideo = {
  uri: string;
  name: string;
  durationMs: number | null;
  sizeBytes: number | null;
};

export type QuestionDraft = {
  q: string;
  correct: string;
  wrong: string[];
  exp: string;
};

export const questionEmpty = (q: QuestionDraft) =>
  !q.q.trim() && !q.correct.trim() && !q.exp.trim() && q.wrong.every((w) => !w.trim());

/** Dosya seçilir seçilmez süre/boyut ön kontrolü. Hata metni ya da null. */
export function checkVideo(v: PickedVideo & { mimeType?: string | null }): string | null {
  if (v.mimeType?.includes("webm")) return "WebM desteklenmiyor, MP4 seç.";
  if (v.sizeBytes != null && v.sizeBytes > LIMITS.maxBytes)
    return "Video en çok 100 MB olabilir.";
  if (v.durationMs != null) {
    if (v.durationMs < LIMITS.minDurationMs) return "Video en az 20 saniye olmalı.";
    if (v.durationMs > LIMITS.maxDurationMs) return "Video en çok 2 dakika olabilir.";
  }
  return null;
}

function checkQuestion(q: QuestionDraft, label: string): string | null {
  const text = q.q.trim();
  if (text.length < LIMITS.qMin || text.length > LIMITS.qMax)
    return `${label}: soru metni ${LIMITS.qMin}-${LIMITS.qMax} karakter olmalı.`;
  const opts = [q.correct, ...q.wrong].map((o) => o.trim());
  if (opts.some((o) => o.length < 1 || o.length > LIMITS.optMax))
    return `${label}: 4 şıkkın hepsini doldur (en çok ${LIMITS.optMax} karakter).`;
  if (new Set(opts.map((o) => o.toLocaleLowerCase("tr-TR"))).size !== 4)
    return `${label}: şıklar birbirinden farklı olmalı.`;
  if (q.exp.trim().length > LIMITS.expMax)
    return `${label}: açıklama en çok ${LIMITS.expMax} karakter olabilir.`;
  return null;
}

export type FormInput = {
  title: string;
  topic: string;
  q1: QuestionDraft;
  q2: QuestionDraft;
  showQ2: boolean;
  video: PickedVideo | null;
};

export function validateForm(f: FormInput): string | null {
  const title = f.title.trim();
  const topic = f.topic.trim();
  if (title.length < LIMITS.titleMin || title.length > LIMITS.titleMax)
    return `Başlık ${LIMITS.titleMin}-${LIMITS.titleMax} karakter olmalı.`;
  if (topic.length < LIMITS.topicMin || topic.length > LIMITS.topicMax)
    return `Konu ${LIMITS.topicMin}-${LIMITS.topicMax} karakter olmalı.`;
  if (!f.video) return "20 sn ile 2 dk arasında bir video seç.";
  const e1 = checkQuestion(f.q1, "Soru 1");
  if (e1) return e1;
  if (f.showQ2 && !questionEmpty(f.q2)) {
    const e2 = checkQuestion(f.q2, "Soru 2");
    if (e2) return e2;
  }
  return null;
}

const toApiQ = (q: QuestionDraft) => ({
  text: q.q.trim(),
  correctAnswer: q.correct.trim(),
  wrongAnswers: q.wrong.map((w) => w.trim()),
  explanation: q.exp.trim(),
});

/** POST /videos gövdesindeki `questions` dizisi */
export function buildQuestions(f: FormInput) {
  return [toApiQ(f.q1), ...(f.showQ2 && !questionEmpty(f.q2) ? [toApiQ(f.q2)] : [])];
}
