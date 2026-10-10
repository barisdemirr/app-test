import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Radio, X } from "lucide-react-native";
import { C, DIAG, SH } from "@/theme";
import type { LiveSessionDto } from "@/api/types";
import { canReview } from "@/utils/live";
import { formatRemaining, toDate } from "@/utils/time";
import { useNow } from "@/hooks/useNow";
import { Press, Ripple, T } from "@/components/ui";

type Pick = { s: LiveSessionDto; kind: "join" | "live" | "soon" | "review" };

/** Hangi oturum için uyarı gösterilecek? Katılabilir > sürüyor > yaklaşıyor > değerlendirme. */
function pickSession(items: LiveSessionDto[], nowMs: number): Pick | null {
  const mine = items.filter((s) => s.myRole !== "none");
  const join = mine.find((s) => s.canJoin);
  if (join) return { s: join, kind: "join" };
  const live = mine.find((s) => s.status === "Live");
  if (live) return { s: live, kind: "live" };
  const soon = mine
    .filter((s) => s.status === "Booked" && s.scheduledAtUtc)
    .map((s) => ({ s, left: toDate(s.scheduledAtUtc!).getTime() - nowMs }))
    .filter((x) => x.left > 0 && x.left < 10 * 60_000)
    .sort((a, b) => a.left - b.left)[0];
  if (soon) return { s: soon.s, kind: "soon" };
  const review = mine.find(canReview);
  if (review) return { s: review, kind: "review" };
  return null;
}

/**
 * Ekranlar arası yüzen uyarı: eğitim/görüşme katılmaya hazır olduğunda (ya da yaklaşırken)
 * hangi ekranda olursan ol "Katıl" düğmesi çıkar. Katılma penceresi kısadır (eğitimde ~5 dk),
 * bu yüzden kullanıcının oturum sayfasında beklemesine gerek kalmasın diye global.
 */
export function JoinBanner({
  items,
  hideForId,
  bottom,
  hotOnly = false,
  onJoin,
  onOpen,
}: {
  items: LiveSessionDto[];
  /** Yalnızca "şimdi katıl / görüşme sürüyor" durumlarını göster (örn. tam ekran akışta) */
  hotOnly?: boolean;
  /** Zaten bu oturumun ekranındaysak gösterme */
  hideForId?: string | null;
  bottom: number;
  onJoin: (s: LiveSessionDto) => void;
  onOpen: (id: string) => void;
}) {
  const nowMs = useNow(1000, items.length > 0);
  const pick = useMemo(() => pickSession(items, nowMs), [items, nowMs]);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const isHot = pick?.kind === "join" || pick?.kind === "live";
  const visible =
    !!pick &&
    pick.s.id !== hideForId &&
    !(pick.kind === "soon" && dismissed === pick.s.id) &&
    (!hotOnly || isHot);

  const v = useRef(new Animated.Value(0)).current;
  const last = useRef<Pick | null>(null);
  if (pick) last.current = pick;
  useEffect(() => {
    Animated.timing(v, {
      toValue: visible ? 1 : 0,
      duration: visible ? 380 : 220,
      easing: visible ? Easing.out(Easing.back(1.2)) : Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [visible, v]);

  const shown = visible ? pick : last.current;
  if (!shown) return null;
  const { s, kind } = shown;
  const hot = kind === "join" || kind === "live";
  const lesson = s.kind === "Lesson";

  let title = "";
  let sub = "";
  if (kind === "join") {
    title = lesson ? "Eğitimin başladı" : "Görüşme hazır";
    const left = s.joinDeadlineUtc ? toDate(s.joinDeadlineUtc).getTime() - nowMs : 0;
    sub = left > 0 ? `${s.title} · katılmak için ${formatRemaining(left)} var` : s.title;
  } else if (kind === "live") {
    title = "Görüşme sürüyor";
    sub = `${s.title} · geri dönmek için dokun`;
  } else if (kind === "soon") {
    const left = toDate(s.scheduledAtUtc!).getTime() - nowMs;
    title = `Eğitim ${formatRemaining(left)} sonra başlıyor`;
    sub = `${s.title} · hazır ol`;
  } else {
    title = "Değerlendirmeni bekliyor";
    sub = s.title;
  }

  return (
    <Animated.View
      pointerEvents={visible ? "box-none" : "none"}
      style={{
        position: "absolute",
        left: 14,
        right: 14,
        bottom,
        zIndex: 30,
        opacity: v,
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
      }}
    >
      <Press
        onPress={() => (hot ? onJoin(s) : onOpen(s.id))}
        style={[
          {
            borderRadius: 22,
            overflow: "hidden",
            flexDirection: "row",
            alignItems: "center",
            padding: 12,
            gap: 12,
          },
          SH.float,
        ]}
      >
        <LinearGradient
          colors={hot ? [C.coral, "#FF5F7A"] : [C.abyss, C.deep]}
          {...DIAG}
          style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
        />
        <View style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}>
          {hot ? (
            <View style={{ position: "absolute" }}>
              <Ripple size={44} color="#fff" />
            </View>
          ) : null}
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: "rgba(255,255,255,.22)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Radio size={17} color="#fff" />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <T f="bb" style={{ color: "#fff", fontSize: 13.5 }} numberOfLines={1}>
            {title}
          </T>
          <T style={{ color: "rgba(255,255,255,.88)", fontSize: 11, marginTop: 1 }} numberOfLines={1}>
            {sub}
          </T>
        </View>
        {hot ? (
          <View style={{ backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 9 }}>
            <T f="bb" style={{ color: C.coral, fontSize: 12.5 }}>
              {kind === "live" ? "Dön" : "Katıl"}
            </T>
          </View>
        ) : kind === "soon" ? (
          <Press
            onPress={() => setDismissed(s.id)}
            hitSlop={10}
            style={{ width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,.15)" }}
          >
            <X size={14} color="#fff" />
          </Press>
        ) : (
          <View style={{ backgroundColor: "rgba(255,255,255,.18)", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 }}>
            <T f="bb" style={{ color: "#fff", fontSize: 12 }}>
              Aç
            </T>
          </View>
        )}
      </Press>
    </Animated.View>
  );
}
