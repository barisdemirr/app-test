import type { Question } from "@/types";

export const initialQuestions: Question[] = [
  {
    id: "q1",
    name: "Ada",
    initials: "AY",
    color: "#8B8CF8",
    course: "Matematik 1",
    topic: "Limit",
    text: "L'Hôpital kuralını hangi durumlarda kullanabilirim?",
    answers: [
      "Belirsiz biçimler oluştuğunda ve koşullar sağlandığında kullanabilirsin.",
      "Önce 0/0 ya da ∞/∞ biçiminde olduğunu kontrol et.",
    ],
  },
  {
    id: "q2",
    name: "Selin",
    initials: "SK",
    color: "#DD8BB6",
    course: "Fizik 1",
    topic: "Çarpışma",
    text: "Esnek ve esnek olmayan çarpışmada hangi büyüklükler korunur?",
    answers: [
      "Her iki durumda momentum korunur; esnek çarpışmada kinetik enerji de korunur.",
    ],
  },
  {
    id: "q3",
    name: "Zehra",
    initials: "ZA",
    color: "#5AB996",
    course: "Genel Kimya",
    topic: "Asit-baz",
    text: "Zayıf asit çözeltisinin pH değerini nasıl hesaplarım?",
    answers: ["Ka ve başlangıç derişimiyle denge tablosu kurabilirsin."],
  },
  {
    id: "q4",
    name: "Naz",
    initials: "NK",
    color: "#F09875",
    course: "Anatomi",
    topic: "Dolaşım",
    text: "Kalpte kanın akış sırası nedir?",
    answers: [
      "Sağ kulakçık, sağ karıncık, akciğerler, sol kulakçık ve sol karıncık.",
    ],
  },
  {
    id: "q5",
    name: "Ayşe",
    initials: "AK",
    color: "#55A2CE",
    course: "Hücre Biyolojisi",
    topic: "Hücre bölünmesi",
    text: "Mitoz ile mayoz arasındaki fark nedir?",
    answers: [
      "Mitoz iki, mayoz dört hücre oluşturur; genetik çeşitlilik mayozda artar.",
    ],
  },
  {
    id: "q6",
    name: "Eren",
    initials: "ED",
    color: "#A289D6",
    course: "Matematik 1",
    topic: "Seriler",
    text: "Bir serinin yakınsadığını nasıl anlarım?",
    answers: [],
  },
];