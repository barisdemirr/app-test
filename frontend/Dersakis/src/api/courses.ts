import { api } from "./http";

export type Course = { id: string; name: string; slug: string };

/** GET /courses — 5 sabit ders. Seçimler ve filtreler `id` ile yapılır. */
export const fetchCourses = () => api<Course[]>("/courses");
