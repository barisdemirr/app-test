import type { Reward } from "@/types";

export const rewardsData: Reward[] = [
  {
    id: "w1",
    name: "Kalkülüs soru bankası (PDF)",
    source: "Dersakış özel içeriği",
    price: 80,
    icon: "book",
  },
  {
    id: "w2",
    name: "Mentörle 15 dk soru-cevap",
    source: "Eğitmen ayrıcalığı",
    price: 150,
    icon: "mentor",
    featured: true,
  },
  {
    id: "w3",
    name: "Fizik 1 formül kitapçığı",
    source: "Dersakış özel içeriği",
    price: 70,
    icon: "spark",
  },
  {
    id: "w4",
    name: "Online sınav provası",
    source: "Sınav hazırlık",
    price: 120,
    icon: "exam",
  },
  {
    id: "w5",
    name: "Dijital flashcard seti",
    source: "Hızlı tekrar",
    price: 60,
    icon: "cards",
  },
  {
    id: "w6",
    name: "Kitap kafe indirimi %15",
    source: "Öğrenci ayrıcalığı",
    price: 60,
    icon: "coffee",
  },
  {
    id: "w7",
    name: "Reklamsız 1 hafta",
    source: "Dersakış üyeliği",
    price: 50,
    icon: "crown",
  },
];

export const DAILY_CAP = 60;