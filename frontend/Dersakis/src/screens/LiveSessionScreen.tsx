import React, { useEffect, useRef } from "react";
import { Alert, RefreshControl, ScrollView, Vibration, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CircleX,
  Clock,
  Mic,
  Video,
  Wallet,
} from "lucide-react-native";
import { C, DIAG, G_PRIMARY, SH } from "@/theme";
import { absoluteUrl } from "@/config";
import { errorMessage } from "@/api/errors";
import type { LiveSessionDto } from "@/api/types";
import {
  useBookLesson,
  useCancelLive,
  useEndLive,
  useLiveSession,
  useReviewLive,
} from "@/queries";
import { useServerClock, useTick } from "@/hooks/useServerCountdown";
import {
  canCancel,
  canEnd,
  canReview,
  isFinal,
  isPayer,
  outcomeText,
  primaryCta,
  statusLabel,
  timelineOf,
} from "@/utils/live";
import { formatClock, formatDateTime, formatWhen, toDate } from "@/utils/time";
import { colorFor, initialsOf } from "@/utils/user";
import { Avatar, Enter, GradBtn, LiveDot, Press, Pulse, Ripple, Skeleton, T } from "@/components/ui";
import { CtaButton } from "@/components/live";

export type LiveSessionScreenProps = {
  id: string;
  topInset: number;
  bodyPad: number;
  credits: number;
  onBack: () => void;
  /** Katıl / Cevapla: sunucuya join + görüşme ekranı (Agora) */
  onJoin: (s: LiveSessionDto) => void;
  showToast: (m: string) => void;
};

const card = { backgroundColor: "#fff", borderRadius: 22, padding: 16 } as const;

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "rgba(255,255,255,.12)",
        borderRadius: 16,
        padding: 11,
        gap: 5,
      }}
    >
      {icon}
      <T style={{ color: "rgba(255,255,255,.72)", fontSize: 10 }}>{label}</T>
      <T f="bb" style={{ color: "#fff", fontSize: 13 }} numberOfLines={1}>
        {value}
      </T>
    </View>
  );
}

function Person({
  label,
  p,
  here,
  me,
}: {
  label: string;
  p: LiveSessionDto["host"] | null;
  here?: boolean;
  me?: boolean;
}) {
  if (!p) {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            borderWidth: 1.5,
            borderStyle: "dashed",
            borderColor: C.mist,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <T style={{ color: C.muted }}>?</T>
        </View>
        <View>
          <T f="bb" style={{ fontSize: 13, color: C.muted }}>
            Henüz kimse yok
          </T>
          <T style={{ fontSize: 10.5, color: C.muted }}>{label}</T>
        </View>
      </View>
    );
  }
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 11 }}>
      <Avatar
        initials={initialsOf(p.displayName)}
        color={colorFor(p.id)}
        uri={p.avatarUrl ? absoluteUrl(p.avatarUrl) : null}
        size={40}
      />
      <View style={{ flex: 1 }}>
        <T f="bb" style={{ fontSize: 13.5 }} numberOfLines={1}>
          {p.displayName}
          {me ? " (sen)" : ""}
        </T>
        <T style={{ fontSize: 10.5, color: C.muted }}>{label}</T>
      </View>
      {here ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: "#E6F8F1",
            borderRadius: 999,
            paddingHorizontal: 9,
            paddingVertical: 5,
          }}
        >
          <LiveDot color="#22B07D" size={6} />
          <T f="bs" style={{ fontSize: 10.5, color: "#127A55" }}>
            Kanalda
          </T>
        </View>
      ) : null}
    </View>
  );
}

function Timeline({ s }: { s: LiveSessionDto }) {
  const { steps, current, failed } = timelineOf(s);
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
      {steps.map((name, i) => {
        const done = i < current;
        const now = i === current && !failed && s.status !== "Completed";
        const bad = failed && i === current;
        const col = bad ? C.error : done || s.status === "Completed" ? C.success : now ? C.tide : C.mist;
        return (
          <View key={name} style={{ flex: 1, alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", alignSelf: "stretch" }}>
              <View style={{ flex: 1, height: 2, backgroundColor: i === 0 ? "transparent" : done || s.status === "Completed" ? C.success : C.mist }} />
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: done || s.status === "Completed" || bad ? col : "#fff",
                  borderWidth: 2,
                  borderColor: col,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {bad ? (
                  <CircleX size={12} color="#fff" />
                ) : done || s.status === "Completed" ? (
                  <Check size={13} color="#fff" />
                ) : now ? (
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: col }} />
                ) : null}
              </View>
              <View style={{ flex: 1, height: 2, backgroundColor: i === steps.length - 1 ? "transparent" : done ? C.success : C.mist }} />
            </View>
            <T
              f={now || bad ? "bb" : "b"}
              style={{ fontSize: 9.5, marginTop: 6, color: now ? C.tide : bad ? C.error : C.muted, textAlign: "center" }}
              numberOfLines={1}
            >
              {name}
            </T>
          </View>
        );
      })}
    </View>
  );
}

function Clock_({ label, ms, hint, hot }: { label: string; ms: number; hint?: string; hot?: boolean }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 6 }}>
      <T style={{ color: C.muted, fontSize: 11.5 }}>{label}</T>
      <T f="h" style={{ fontSize: 38, lineHeight: 46, color: hot ? C.coral : C.tide, marginTop: 2, letterSpacing: -1 }}>
        {ms > 0 ? formatClock(ms) : "Güncelleniyor…"}
      </T>
      {hint ? <T style={{ color: C.muted, fontSize: 11, marginTop: 2, textAlign: "center" }}>{hint}</T> : null}
    </View>
  );
}

export function LiveSessionScreen(p: LiveSessionScreenProps) {
  const q = useLiveSession(p.id);
  const s = q.data;
  const clock = useServerClock(s?.serverNowUtc, q.dataUpdatedAt);
  useTick(!!s && !isFinal(s.status));

  const book = useBookLesson();
  const cancel = useCancelLive();
  const end = useEndLive();
  const review = useReviewLive();
  const busy = book.isPending || cancel.isPending || end.isPending || review.isPending;

  const fail = (e: unknown) => p.showToast(errorMessage(e));

  // Katıl düğmesi açıldığı an titreşim + bildirim: kullanıcı ekrana bakmıyor olabilir
  const wasJoinable = useRef<boolean | null>(null);
  useEffect(() => {
    if (!s) return;
    if (wasJoinable.current === false && s.canJoin) {
      Vibration.vibrate([0, 140, 90, 140]);
      p.showToast(s.kind === "Lesson" ? "Eğitim başladı, katılabilirsin" : "Katılabilirsin");
    }
    wasJoinable.current = s.canJoin;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s?.canJoin]);

  const confirmBook = (x: LiveSessionDto) =>
    Alert.alert(
      "Eğitimi satın al",
      `${x.price} kredi düşecek. Eğitim ${formatDateTime(x.scheduledAtUtc!)} tarihinde. Randevu saatinde uygulamadan katılırsın.`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Satın al",
          onPress: () =>
            book.mutate(x.id, {
              onSuccess: () => p.showToast("Eğitimi satın aldın"),
              onError: fail,
            }),
        },
      ],
    );

  const confirmCancel = (x: LiveSessionDto) =>
    Alert.alert(
      "İlanı iptal et",
      x.kind === "Voice"
        ? "Kredin iade edilecek."
        : x.status === "Booked"
          ? "Öğrencinin ücreti iade edilecek."
          : "İlan kaldırılacak.",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "İptal et",
          style: "destructive",
          onPress: () =>
            cancel.mutate(x.id, {
              onSuccess: () => p.showToast("İlan iptal edildi"),
              onError: fail,
            }),
        },
      ],
    );

  const confirmEnd = (x: LiveSessionDto) =>
    Alert.alert("Görüşmeyi bitir", "Görüşme sonlanacak ve değerlendirmeye geçilecek.", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Bitir", onPress: () => end.mutate(x.id, { onError: fail }) },
    ]);

  const doReview = (x: LiveSessionDto, approve: boolean) => {
    const run = () =>
      review.mutate(
        { id: x.id, approve },
        {
          onSuccess: () => p.showToast(approve ? "Onayladın" : "Kredin iade edildi"),
          onError: fail,
        },
      );
    if (approve) return run();
    Alert.alert("Memnun kalmadın mı?", "Karşı taraf kredi kazanmayacak.", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Memnun kalmadım", style: "destructive", onPress: run },
    ]);
  };

  const header = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 5, marginBottom: 14 }}>
      <Press
        onPress={p.onBack}
        style={[
          {
            width: 40,
            height: 40,
            borderRadius: 13,
            backgroundColor: "#fff",
            alignItems: "center",
            justifyContent: "center",
          },
          SH.soft,
        ]}
      >
        <ArrowLeft size={19} color={C.abyss} />
      </Press>
      <T f="h" style={{ fontSize: 21, flex: 1 }} numberOfLines={1}>
        {s ? (s.kind === "Lesson" ? "Eğitim" : "Sesli soru") : "Oturum"}
      </T>
      {s && !isFinal(s.status) ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <LiveDot size={6} />
          <T style={{ fontSize: 10.5, color: C.muted }}>Canlı güncelleniyor</T>
        </View>
      ) : null}
    </View>
  );

  const body = () => {
    if (q.isLoading)
      return (
        <View style={{ gap: 12 }}>
          <Skeleton style={{ height: 230, borderRadius: 24 }} />
          <Skeleton style={{ height: 120, borderRadius: 22 }} />
          <Skeleton style={{ height: 160, borderRadius: 22 }} />
        </View>
      );
    if (!s)
      return (
        <View style={{ gap: 12, alignItems: "center", paddingTop: 40 }}>
          <T style={{ color: C.error, textAlign: "center" }}>{errorMessage(q.error)}</T>
          <GradBtn label="Tekrar dene" small onPress={() => q.refetch()} />
        </View>
      );

    const lesson = s.kind === "Lesson";
    const payer = isPayer(s);
    const nowMs = clock.now();
    const left = (iso: string | null) => (iso ? clock.remainingMs(iso) : 0);
    const result = outcomeText(s);
    const cta = primaryCta(s, nowMs);
    const when = lesson && s.scheduledAtUtc ? formatWhen(s.scheduledAtUtc, nowMs) : null;
    const hot = cta.kind === "join" || cta.kind === "rejoin" || cta.kind === "answer";
    const earnLabel = payer ? "Ödedin" : s.myRole === "none" && lesson ? "Ücret" : "Kazanç";
    const earn = payer ? `${s.price} ✦` : lesson ? (s.myRole === "none" ? `${s.price} ✦` : `+${s.price} ✦`) : `+${s.payout} ✦`;
    const hostHere = s.myRole === "guest" ? s.peerJoined : false;
    const guestHere = s.myRole === "host" ? s.peerJoined : false;
    const endAt =
      lesson && s.scheduledAtUtc && s.durationMinutes
        ? toDate(s.scheduledAtUtc).getTime() + s.durationMinutes * 60_000
        : null;

    return (
      <>
        <Enter>
          <LinearGradient
            colors={[C.abyss, "#0B2F73", colorFor(s.host.id)]}
            locations={[0, 0.6, 1]}
            {...DIAG}
            style={[{ borderRadius: 26, padding: 18, overflow: "hidden" }, SH.card]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <View
                style={{
                  flexShrink: 1,
                  backgroundColor: "rgba(255,255,255,.18)",
                  borderRadius: 999,
                  paddingHorizontal: 11,
                  paddingVertical: 5,
                }}
              >
                <T f="bb" style={{ color: "#fff", fontSize: 10.5 }} numberOfLines={1}>
                  {s.courseName}
                </T>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  backgroundColor: hot ? C.coral : "rgba(6,26,58,.4)",
                  borderRadius: 999,
                  paddingHorizontal: 11,
                  paddingVertical: 5,
                }}
              >
                {hot ? <LiveDot color="#fff" size={6} /> : null}
                <T f="bb" style={{ color: "#fff", fontSize: 10.5 }} numberOfLines={1}>
                  {statusLabel(s)}
                </T>
              </View>
            </View>
            <T f="h" style={{ color: "#fff", fontSize: 23, lineHeight: 29, marginTop: 14 }}>
              {s.title}
            </T>
            <T style={{ color: "rgba(255,255,255,.82)", fontSize: 12.5, lineHeight: 19, marginTop: 7 }}>
              {s.description}
            </T>
            <View style={{ flexDirection: "row", gap: 9, marginTop: 16 }}>
              <InfoTile
                icon={lesson ? <CalendarDays size={15} color="#AEEBF2" /> : <Mic size={15} color="#AEEBF2" />}
                label={when ? when.day : "Tür"}
                value={when ? when.time : "Sesli"}
              />
              <InfoTile
                icon={lesson ? <Clock size={15} color="#AEEBF2" /> : <Video size={15} color="#AEEBF2" />}
                label={lesson ? "Süre" : "Görüşme"}
                value={lesson ? (s.durationMinutes ? `${s.durationMinutes} dk` : "—") : "Anında"}
              />
              <InfoTile icon={<Wallet size={15} color="#FFD66B" />} label={earnLabel} value={earn} />
            </View>
          </LinearGradient>
        </Enter>

        <Enter delay={80}>
          <View
            style={[
              card,
              SH.soft,
              { marginTop: 12, gap: 12, overflow: "hidden" },
              hot ? { borderWidth: 1.5, borderColor: C.coral } : null,
            ]}
          >
            {hot ? (
              <View style={{ position: "absolute", right: -30, top: -30, opacity: 0.5 }}>
                <Ripple size={140} color={C.coral} />
              </View>
            ) : null}

            {/* ---- geri sayımlar ---- */}
            {(s.status === "Pending" || s.status === "Waiting") && (
              <Clock_
                hot
                label={s.canJoin ? "Katılmak için kalan süre" : "Başlamak üzere"}
                ms={left(s.joinDeadlineUtc)}
                hint={s.peerJoined ? "Karşı taraf kanalda seni bekliyor" : undefined}
              />
            )}
            {(s.status === "Booked" || s.status === "Listed") && lesson && (
              <Clock_
                label={s.status === "Booked" ? "Eğitimin başlamasına" : "Randevuya kalan"}
                ms={left(s.scheduledAtUtc)}
                hint={
                  s.status === "Booked"
                    ? "Süre dolunca Katıl düğmesi burada ve her ekranda açılır."
                    : undefined
                }
              />
            )}
            {s.status === "AwaitingApproval" && (
              <Clock_
                label="Otomatik onaya kalan"
                ms={left(s.approvalDeadlineUtc)}
                hint={payer ? "Yanıtlamazsan onaylanmış sayılır" : undefined}
              />
            )}
            {s.status === "Live" && s.liveStartedAtUtc && (
              <Clock_
                hot
                label="Görüşme süresi"
                ms={Math.max(1, nowMs - toDate(s.liveStartedAtUtc).getTime() + 1000)}
                hint={endAt && endAt > nowMs ? `Planlanan bitişe ${formatClock(endAt - nowMs)} var` : undefined}
              />
            )}

            {/* ---- durum metinleri ---- */}
            {s.status === "Open" && s.myRole === "host" && (
              <T style={{ textAlign: "center", color: C.muted, fontSize: 12.5, lineHeight: 18 }}>
                Birinin katılması bekleniyor. Ekranı kapatsan da ilanın açık kalır; biri katılınca
                üstte "Katıl" uyarısı çıkar.
              </T>
            )}
            {s.status === "Pending" && s.myRole === "guest" && (
              <T style={{ textAlign: "center", color: C.muted, fontSize: 12.5, lineHeight: 18 }}>
                İlan sahibi bekleniyor. Gelmezse kredi iade edilir.
              </T>
            )}
            {s.status === "Listed" && s.myRole === "host" && (
              <T style={{ textAlign: "center", color: C.muted, fontSize: 12.5, lineHeight: 18 }}>
                Eğitimin satışta. Bir öğrenci satın alınca haber veririz. Randevuya kadar satılmazsa kapanır.
              </T>
            )}
            {s.status === "Booked" && (
              <T style={{ textAlign: "center", color: C.muted, fontSize: 12.5, lineHeight: 18 }}>
                {s.myRole === "host"
                  ? "Bir öğrenci eğitimini satın aldı. Randevu saatinde uygulamayı açık tut; katılma süresi kısadır (birkaç dakika)."
                  : "Randevu saatinde uygulamayı açık tut; katılma süresi kısadır (birkaç dakika). O saate yakın başka görüşmeye girme."}
              </T>
            )}
            {s.status === "AwaitingApproval" && !payer && (
              <T style={{ textAlign: "center", color: C.muted, fontSize: 12.5 }}>
                Değerlendirme bekleniyor.
              </T>
            )}
            {s.status === "AwaitingApproval" && payer && (
              <T f="bb" style={{ textAlign: "center", fontSize: 14 }}>
                {lesson ? "Eğitimden memnun kaldın mı?" : "Cevabı aldın mı?"}
              </T>
            )}
            {isFinal(s.status) && (
              <View style={{ alignItems: "center", gap: 6, paddingVertical: 6 }}>
                <T f="h" style={{ fontSize: 16 }}>
                  {statusLabel(s)}
                </T>
                {result ? (
                  <T style={{ textAlign: "center", fontSize: 12.5, color: C.muted, lineHeight: 18 }}>
                    {result}
                  </T>
                ) : null}
              </View>
            )}

            {/* ---- eylemler ---- */}
            {cta.kind !== "review" && cta.kind !== "none" && (
              <CtaButton
                cta={cta}
                small={false}
                disabled={busy}
                onPress={() => {
                  if (cta.kind === "book") confirmBook(s);
                  else if (cta.enabled) p.onJoin(s);
                  else q.refetch();
                }}
              />
            )}
            {cta.kind === "book" && p.credits < s.price && (
              <T style={{ textAlign: "center", color: C.error, fontSize: 11.5 }}>
                Yeterli kredin yok (bakiyen {p.credits}).
              </T>
            )}
            {!cta.enabled && cta.hint ? (
              <T style={{ textAlign: "center", color: C.muted, fontSize: 11 }}>{cta.hint}</T>
            ) : null}
            {canReview(s) && (
              <>
                <GradBtn
                  label="Onayla"
                  colors={G_PRIMARY}
                  disabled={busy}
                  onPress={() => doReview(s, true)}
                />
                <GradBtn
                  label="Memnun kalmadım"
                  colors={[C.muted, C.muted]}
                  disabled={busy}
                  onPress={() => doReview(s, false)}
                />
                <T style={{ textAlign: "center", color: C.muted, fontSize: 10.5 }}>
                  "Memnun kalmadım" dersen kredin iade edilir, karşı taraf kredi kazanmaz.
                </T>
              </>
            )}
            {canEnd(s) && (
              <GradBtn
                label="Görüşmeyi bitir"
                colors={[C.abyss, C.deep]}
                disabled={busy}
                onPress={() => confirmEnd(s)}
              />
            )}
            {canCancel(s, nowMs) && (
              <GradBtn
                label="İlanı iptal et"
                colors={[C.coral, C.coral]}
                disabled={busy}
                onPress={() => confirmCancel(s)}
              />
            )}
            {!s.canJoin && s.status === "Open" && s.myRole === "none" && (
              <T style={{ textAlign: "center", color: C.muted, fontSize: 12 }}>
                Şu an bu ilana katılamazsın.
              </T>
            )}
          </View>
        </Enter>
        <Enter delay={150}>
          <View style={[card, SH.soft, { marginTop: 12, gap: 14 }]}>
            <Person
              label={lesson ? "Eğitmen" : "Soran"}
              p={s.host}
              me={s.myRole === "host"}
              here={hostHere}
            />
            <View style={{ height: 1, backgroundColor: C.foam }} />
            <Person
              label={lesson ? "Öğrenci" : "Cevaplayan"}
              p={s.guest}
              me={s.myRole === "guest"}
              here={guestHere}
            />
          </View>
        </Enter>

        <Enter delay={220}>
          <View style={[card, SH.soft, { marginTop: 12, paddingVertical: 18 }]}>
            <Timeline s={s} />
          </View>
        </Enter>

      </>
    );
  };

  return (
    <View style={{ flex: 1, paddingTop: p.topInset + 12 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: p.bodyPad }}
        refreshControl={
          <RefreshControl refreshing={q.isRefetching && !q.isLoading} onRefresh={() => q.refetch()} tintColor={C.tide} />
        }
      >
        {header}
        {body()}
      </ScrollView>
    </View>
  );
}
