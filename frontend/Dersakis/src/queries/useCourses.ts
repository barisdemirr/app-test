import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCourses } from "@/api/courses";
import { queryKeys } from "./keys";

/** Dersler sabittir: bir kez çek, süresiz önbellekte tut. */
export function useCourses() {
  return useQuery({
    queryKey: queryKeys.courses,
    queryFn: fetchCourses,
    staleTime: Infinity,
  });
}

/** Ders adları (sunucudan). Yüklenirken boş dizi. */
export function useCourseNames(): string[] {
  const { data } = useCourses();
  return useMemo(() => (data ?? []).map((c) => c.name), [data]);
}
