import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, Easing, View, useWindowDimensions } from "react-native";
import { Dolphin } from "./Dolphin";

export type DashOpts = {
  /** Ekranın dikey konumu (0 üst, 1 alt). Varsayılan 0.3 */
  at?: number;
  size?: number;
};

type Ctx = { dash: (o?: DashOpts) => void };
const MascotCtx = createContext<Ctx>({ dash: () => {} });
export const useMascot = () => useContext(MascotCtx);

/**
 * Yunus ekrana atlayarak gelir, gülümser, sonra karşı yöne hızla kaçar (~1.7 sn).
 * Tek bir `progress` değeri; tamamı native sürücüde, dokunmaları engellemez.
 */
function Dash({ at, size, dir, onDone }: { at: number; size: number; dir: 1 | -1; onDone: () => void }) {
  const { width: W, height: H } = useWindowDimensions();
  const p = useRef(new Animated.Value(0)).current;
  const hh = size * (170 / 220);
  const mid = W / 2 - size / 2;
  const xs = [-size * 1.1, mid, mid + 16, W + size * 0.2];
  const x = dir === 1 ? xs : xs.map((v) => W - v - size);
  const baseY = H * at;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(p, { toValue: 0.5, duration: 620, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(p, { toValue: 0.56, duration: 460, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(p, { toValue: 1, duration: 520, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start(({ finished }) => finished && onDone());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const r = (a: number[]) => p.interpolate({ inputRange: [0, 0.5, 0.56, 1], outputRange: a.map(String) });
  const rot = p.interpolate({
    inputRange: [0, 0.5, 0.56, 1],
    outputRange: dir === 1 ? ["-24deg", "0deg", "4deg", "20deg"] : ["24deg", "0deg", "-4deg", "-20deg"],
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: baseY,
        left: 0,
        width: size,
        height: hh,
        opacity: p.interpolate({ inputRange: [0, 0.08, 0.92, 1], outputRange: [0, 1, 1, 0] }),
        transform: [
          { translateX: r(x) },
          { translateY: r([hh * 0.7, -hh * 0.15, -hh * 0.2, hh * 0.5]) },
          { rotate: rot },
          { scale: r([0.85, 1.1, 1.1, 0.9]) },
        ],
      }}
    >
      <Dolphin size={size} mood="joy" flip={dir === -1} />
    </Animated.View>
  );
}

export function MascotProvider({ children }: { children: React.ReactNode }) {
  const [runs, setRuns] = useState<{ id: number; at: number; size: number; dir: 1 | -1 }[]>([]);
  const n = useRef(0);
  const busy = useRef(false);

  const dash = useCallback((o?: DashOpts) => {
    if (busy.current) return;
    busy.current = true;
    n.current += 1;
    const id = n.current;
    setRuns([{ id, at: o?.at ?? 0.3, size: o?.size ?? 132, dir: id % 2 ? 1 : -1 }]);
  }, []);
  const done = useCallback(() => {
    busy.current = false;
    setRuns([]);
  }, []);

  const value = useMemo(() => ({ dash }), [dash]);
  return (
    <MascotCtx.Provider value={value}>
      {children}
      <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, elevation: 999, overflow: "hidden" }}>
        {runs.map((r) => (
          <Dash key={r.id} at={r.at} size={r.size} dir={r.dir} onDone={done} />
        ))}
      </View>
    </MascotCtx.Provider>
  );
}

/** Havada hafifçe sallanan, sürekli canlı duran maskot (boş durumlar, ekran süsleri). */
export function FloatingDolphin({
  size = 90,
  mood = "smile",
  flip = false,
}: {
  size?: number;
  mood?: "smile" | "joy" | "wink";
  flip?: boolean;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const l = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    l.start();
    return () => l.stop();
  }, [v]);
  return (
    <Animated.View
      style={{
        transform: [
          { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [3, -5] }) },
          { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ["-4deg", "4deg"] }) },
        ],
      }}
    >
      <Dolphin size={size} mood={mood} flip={flip} />
    </Animated.View>
  );
}
