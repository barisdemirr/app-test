export const FONT = {
  h: "BricolageGrotesque_700Bold",
  hm: "BricolageGrotesque_600SemiBold",
  b: "InstrumentSans_400Regular",
  bm: "InstrumentSans_500Medium",
  bs: "InstrumentSans_600SemiBold",
  bb: "InstrumentSans_700Bold",
} as const;

export type FontKey = keyof typeof FONT;