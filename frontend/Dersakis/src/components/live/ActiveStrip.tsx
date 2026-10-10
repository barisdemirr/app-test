import React from "react";
import { View } from "react-native";
import { Clock } from "lucide-react-native";
import { C, SH } from "@/theme";
import type { LiveSessionDto } from "@/api/types";
import { primaryCta, statusLabel } from "@/utils/live";
import { useNow } from "@/hooks/useNow";
import { Enter, Press, SectionTitle, T } from "@/components/ui";
import { CtaButton, DateBadge, MetaChip, TimeHint } from "./parts";

const roleText = (s: LiveSessionDto) =>
  s.kind === "Lesson"
    ? s.myRole === "host"
      ? "Eğitmen sensin"
      : "Öğrencisin"
    : s.myRole === "host"
      ? "Soruyu sen sordun"
      : "Cevaplayansın";

/** Tek bir "yapılacak" oturum: tarih, kişi, süre, ücret, geri sayım ve eylem düğmesi. */
function ActiveCard({
  s,
  nowMs,
  onOpen,
  onJoin,
}: {
  s: LiveSessionDto;
  nowMs: number;
  onOpen: (id: string) => void;
  onJoin: (s: LiveSessionDto) => void;
}) {
  const cta = primaryCta(s, nowMs);
  const hot = cta.kind === "join" || cta.kind === "rejoin";
  const peer = s.myRole === "host" ? s.guest : s.host;
  const act = () => (cta.enabled && (cta.kind === "join" || cta.kind === "rejoin") ? onJoin(s) : onOpen(s.id));
  return (
    <Press
      onPress={() => onOpen(s.id)}
      style={[
        {
          padding: 14,
          borderRadius: 20,
          backgroundColor: "#fff",
          borderWidth: hot ? 1.5 : 1,
          borderColor: hot ? C.coral : C.mist,
          gap: 12,
        },
        SH.soft,
      ]}
    >
      <View style={{ flexDirection: "row", gap: 12 }}>
        <DateBadge s={s} nowMs={nowMs} />
        <View style={{ flex: 1, gap: 4 }}>
          <T f="h" style={{ fontSize: 15, lineHeight: 19 }} numberOfLines={2}>
            {s.title}
          </T>
          <T style={{ fontSize: 11, color: C.muted }} numberOfLines={1}>
            {s.courseName} · {roleText(s)}
            {peer ? ` · ${peer.displayName}` : ""}
          </T>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
            {s.kind === "Lesson" && s.durationMinutes ? (
              <MetaChip icon={<Clock size={10.5} color={C.muted} />} label={`${s.durationMinutes} dk`} />
            ) : null}
            <MetaChip tone="coin" label={`${s.kind === "Lesson" ? s.price : s.payout} ✦`} />
            <MetaChip label={statusLabel(s)} tone={hot ? "live" : "soft"} />
          </View>
        </View>
      </View>
      <View style={{ height: 1, backgroundColor: C.foam }} />
      <View style={{ gap: 9 }}>
        <TimeHint s={s} nowMs={nowMs} />
        <CtaButton cta={cta} onPress={act} />
      </View>
    </Press>
  );
}

/** "Devam eden / yaklaşan": yapılacak bir şeyin olan oturumlar (scope=active). */
export function ActiveStrip({
  items,
  onOpen,
  onJoin,
  onSeeAll,
}: {
  items: LiveSessionDto[];
  onOpen: (id: string) => void;
  onJoin: (s: LiveSessionDto) => void;
  onSeeAll?: () => void;
}) {
  const nowMs = useNow(1000, items.length > 0);
  if (items.length === 0) return null;
  return (
    <>
      <SectionTitle title="Devam eden / yaklaşan" action="Oturumlarım" onAction={onSeeAll} />
      <View style={{ gap: 11 }}>
        {items.map((s, i) => (
          <Enter key={s.id} delay={i * 70}>
            <ActiveCard s={s} nowMs={nowMs} onOpen={onOpen} onJoin={onJoin} />
          </Enter>
        ))}
      </View>
    </>
  );
}
