import { api } from "./http";

export type Preferences = {
  courseIds: string[];
  interests: string[];
  availableInterests: string[];
};

export type PreferencesInput = { courseIds: string[]; interests: string[] };

/** GET /me/preferences — courseIds boşsa ders seçimi (onboarding) gösterilir. */
export const fetchPreferences = () => api<Preferences>("/me/preferences");

/** PUT /me/preferences — listeyi BÜTÜNÜYLE değiştirir (courseIds 1-20). */
export const savePreferences = (input: PreferencesInput) =>
  api<Preferences>("/me/preferences", { method: "PUT", body: input });
