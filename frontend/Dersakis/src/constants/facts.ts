/**
 * "Biliyor muydun?" kartları istemci sabitidir (sunucu içeriği değil).
 * `interest`, /me/preferences → availableInterests değerleriyle eşleşir.
 */
export type Fact = { id: string; interest: string; text: string };

export const FACTS: Fact[] = [
  { id: "f1", interest: "Fizik", text: "Işık boşlukta saniyede yaklaşık 300.000 km yol alır." },
  { id: "f2", interest: "Uzay", text: "Güneş'ten gelen ışık Dünya'ya yaklaşık 8 dakikada ulaşır." },
  { id: "f3", interest: "Matematik", text: "Sıfır, doğal sayıların toplamında etkisiz elemandır: a + 0 = a." },
  { id: "f4", interest: "Kimya", text: "Su, 4 °C civarında en yoğun halindedir; bu yüzden buz suyun üstünde yüzer." },
  { id: "f5", interest: "Tıp", text: "İnsan kalbi bir günde yaklaşık 100.000 kez atar." },
  { id: "f6", interest: "Tarih", text: "Yazı, yaklaşık 5.000 yıl önce Mezopotamya'da ortaya çıktı." },
  { id: "f7", interest: "Spor", text: "Maraton mesafesi 42,195 km olarak 1921'de standartlaştırıldı." },
];
