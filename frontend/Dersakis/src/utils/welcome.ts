import * as SecureStore from "expo-secure-store";

/** Karşılama akışı yalnızca cihazdaki İLK açılışta gösterilir; seçimler girişten sonra tercihe çevrilir. */
const SEEN = "dp_welcome_seen";
const PICK = "dp_welcome_pick";

export type WelcomePick = {
  level: string | null;
  track: string | null;
  dept: string | null;
  /** Seçilen derslerin sunucu eşleme anahtarları ("matematik", "kimya"...) */
  keys: string[];
  labels: string[];
};

export async function hasSeenWelcome(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(SEEN)) === "1";
  } catch {
    return false;
  }
}

export async function finishWelcome(pick: WelcomePick): Promise<void> {
  try {
    await SecureStore.setItemAsync(PICK, JSON.stringify(pick));
    await SecureStore.setItemAsync(SEEN, "1");
  } catch {
    // depolama yoksa akış bu oturumda bir kez daha görünebilir, kritik değil
  }
}

export async function takeWelcomePick(): Promise<WelcomePick | null> {
  try {
    const raw = await SecureStore.getItemAsync(PICK);
    if (!raw) return null;
    await SecureStore.deleteItemAsync(PICK);
    return JSON.parse(raw) as WelcomePick;
  } catch {
    return null;
  }
}
