import React, { useEffect, useRef } from "react";
import { Alert, RefreshControl, ScrollView, Vibration, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  BellRing,
  CalendarDays,
  Camera,
  Clock,
  GraduationCap,
  Mic,
  Users,
  Volume2,
  Wallet,
  Wifi,
} from "lucide-react-native";
import { C, DIAG, G_PRIMARY, SH } from "@/theme";
import { absoluteUrl } from "@/config";
import { errorMessage } from "@/api/errors";
import type { LiveSessionDto } from "@/api/types";
import { useBookLesson, useCancelLive, useEndLive, useLiveSession, useReviewLive } from "@/queries";
import { useServerClock, useTick } from "@/hooks/useServerCountdown";
import { canCancel, canEnd, canReview, isFinal, isPayer, outcomeText, primaryCta, statusLabel } from "@/utils/live";
import { formatClock, formatDateTime, formatWhen, toDate } from "@/utils/time";
import { colorFor, initialsOf } from "@/utils/user";
import { Avatar, Enter, GradBtn, LiveDot, Press, Pulse, Ripple, Skeleton, T } from "@/components/ui";
import { CtaButton } from "@/components/live";
import { Clock_, InfoTile, Timeline, sessionCard } from "@/components/live/SessionParts";
import type { LiveSessionScreenProps } from "./LiveSessionScreen";

/** Sınıf: tek bir koltuk (eğitmen ya da öğrenci). Boş koltuk kesik çizgili gösterilir. */
function Seat({
  role,
  person,
  me,
  here,
  emptyText,
}: {
  role: string;
  person: LiveSessionDto["host"] | null;
  me?: boolean;
  here?: boolean;
  emptyText: string;
}) {
  return (
    <View style={{ flex: 1, alignItems: "center", gap: 8 }}>
      <View
        style={{
          paddingHorizontal: 10,
          paddingVertical: 3,
          borderRadius: 999,
          backgroundColor: role === "Eğitmen" ? "rgba(255,214,107,.22)" : "rgba(174,235,242,.22)",
        }}
      >
        <T f="bb" style={{ fontSize: 10.5, color: role === "Eğitmen" ? "#FFD66B" : "#AEEBF2" }}>
          {role}
        </T>
      </View>
      <View style={{ width: 84, height: 84, alignItems: "center", justifyContent: "center" }}>
        {here && (
          <View style={{ position: "absolute" }}>
            <Ripple size={84} color="rgba(34,176,125,.7)" rings={2} duration={2400} />
          </View>
        )}
        {person ? (
          <Avatar
            initials={initialsOf(person.displayName)}
            color={colorFor(person.id)}
            uri={person.avatarUrl ? absoluteUrl(person.avatarUrl) : null}
            size={64}
          />
        ) : (
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              borderWidth: 2,
              borderStyle: "dashed",
              borderColor: "rgba(255,255,255,.4)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <T f="h" style={{ color: "rgba(255,255,255,.6)", fontSize: 22 }}>?</T>
          </View>
        )}
      </View>
      <T f="bb" style={{ color: "#fff", fontSize: 13, textAlign: "center" }} numberOfLines={1}>
        {person ? `${person.displayName}${me ? " (sen)" : ""}` : emptyText}
      </T>
      {person ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            backgroundColor: here ? "rgba(34,176,125,.22)" : "rgba(255,255,255,.12)",
            borderRadius: 999,
            paddingHorizontal: 9,
            paddingVertical: 4,
          }}
        >
          <LiveDot color={here ? "#22B07D" : "#9FB3CF"} size={6} />
          <T f="bs" style={{ fontSize: 10.5, color: here ? "#7FE3B8" : "#B7C7D9" }}>
            {here ? "Derste" : me ? "Hazırsın" : "Henüz gelmedi"}
          </T>
        </View>
      ) : null}
    </View>
  );
}

function Tip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View
        style={{ width: 34, height: 34, borderRadius: 11, backgroundColor: "#E6F0FF", alignItems: "center", justifyContent: "center" }}
      >
        {icon}
      </View>
      <T style={{ flex: 1, fontSize: 12.5, lineHeight: 18, color: C.ink }}>{text}</T>
    </View>
  );
}

/**
 * Eğitim (görüntülü, birebir) oturum sayfası. Görüşme (Agora) ekranından ÖNCE gösterilir.
 * Oda en fazla 2 kişidir: bir eğitmen ve bir öğrenci.
 */
export function LessonSessionScreen(p: LiveSessionScreenProps) {
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

  // Katıl düğmesi açıldığı an titreşim + bildirim
  const wasJoinable = useRef<boolean | null>(null);
  useEffect(() => {
    if (!s) return;
    if (wasJoinable.current === false && s.canJoin) {
      Vibration.vibrate([0, 140, 90, 140]);
      p.showToast("Eğitim başladı, katılabilirsin");
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
          onPress: () => book.mutate(x.id, { onSuccess: () => p.showToast("Eğitimi satın aldın"), onError: fail }),
        },
      ],
    );

  const confirmCancel = (x: LiveSessionDto) =>
    Alert.alert(
      "Eğitimi iptal et",
      x.status === "Booked" ? "Öğrencinin ücreti iade edilecek." : "İlan kaldırılacak.",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "İptal et",
          style: "destructive",
          onPress: () => cancel.mutate(x.id, { onSuccess: () => p.showToast("Eğitim iptal edildi"), onError: fail }),
        },
      ],
    );

  const confirmEnd = (x: LiveSessionDto) =>
    Alert.alert("Eğitimi bitir", "Ders sonlanacak ve öğrencinin değerlendirmesine geçilecek.", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Bitir", onPress: () => end.mutate(x.id, { onError: fail }) },
    ]);

  const doReview = (x: LiveSessionDto, approve: boolean) => {
    const run = () =>
      review.mutate(
        { id: x.id, approve },
        { onSuccess: () => p.showToast(approve ? "Onayladın" : "Kredin iade edildi"), onError: fail },
      );
    if (approve) return run();
    Alert.alert("Eğitimden memnun kalmadın mı?", "Kredin iade edilir, eğitmen kredi kazanmaz.", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Memnun kalmadım", style: "destructive", onPress: run },
    ]);
  };

  const header = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 5, marginBottom: 14 }}>
      <Press
        onPress={p.onBack}
        accessibilityLabel="Geri"
        style={[{ width: 40, height: 40, borderRadius: 13, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }, SH.soft]}
      >
        <ArrowLeft size={19} color={C.abyss} />
      </Press>
      <T f="h" style={{ fontSize: 21, flex: 1 }} numberOfLines={1}>Canlı eğitim</T>
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
          <Skeleton style={{ height: 200, borderRadius: 24 }} />
          <Skeleton style={{ height: 140, borderRadius: 22 }} />
        </View>
      );
    if (!s)
      return (
        <View style={{ gap: 12, alignItems: "center", paddingTop: 40 }}>
          <T style={{ color: C.error, textAlign: "center" }}>{errorMessage(q.error)}</T>
          <GradBtn label="Tekrar dene" small onPress={() => q.refetch()} />
        </View>
      );

    const isTeacher = s.myRole === "host";
    const isStudent = s.myRole === "guest";
    const payer = isPayer(s);
    const nowMs = clock.now();
    const left = (iso: string | null) => (iso ? clock.remainingMs(iso) : 0);
    const result = outcomeText(s);
    const cta = primaryCta(s, nowMs);
    const when = s.scheduledAtUtc ? formatWhen(s.scheduledAtUtc, nowMs) : null;
    const hot = cta.kind === "join" || cta.kind === "rejoin";
    const earnLabel = payer ? "Ödedin" : isTeacher ? "Kazancın" : "Ücret";
    const earn = payer ? `${s.price} ✦` : isTeacher ? `+${s.price} ✦` : `${s.price} ✦`;
    const hostHere = isStudent ? s.peerJoined : false;
    const guestHere = isTeacher ? s.peerJoined : false;
    const startMs = s.scheduledAtUtc ? toDate(s.scheduledAtUtc).getTime() : null;
    const endAt = startMs && s.durationMinutes ? startMs + s.durationMinutes * 60_000 : null;
    const upcoming = s.status === "Listed" || s.status === "Booked" || s.status === "Waiting" || s.status === "Pending";
    const liveElapsed = s.liveStartedAtUtc ? Math.max(0, nowMs - toDate(s.liveStartedAtUtc).getTime()) : 0;
    const planned = (s.durationMinutes ?? 0) * 60_000;
    const progress = planned > 0 ? Math.min(1, liveElapsed / planned) : 0;

    return (
      <>
        {/* ---- ders kartı ---- */}
        <Enter>
          <LinearGradient
            colors={[C.abyss, "#0B2F73", colorFor(s.host.id)]}
            locations={[0, 0.6, 1]}
            {...DIAG}
            style={[{ borderRadius: 26, padding: 18, overflow: "hidden" }, SH.card]}
          >
            <View style={{ position: "absolute", right: -14, top: -10, opacity: 0.1 }}>
              <GraduationCap size={150} color="#fff" />
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <View style={{ flexShrink: 1, backgroundColor: "rgba(255,255,255,.18)", borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5 }}>
                <T f="bb" style={{ color: "#fff", fontSize: 10.5 }} numberOfLines={1}>{s.courseName}</T>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  backgroundColor: hot || s.status === "Live" ? C.coral : "rgba(6,26,58,.4)",
                  borderRadius: 999,
                  paddingHorizontal: 11,
                  paddingVertical: 5,
                }}
              >
                {hot || s.status === "Live" ? <LiveDot color="#fff" size={6} /> : null}
                <T f="bb" style={{ color: "#fff", fontSize: 10.5 }} numberOfLines={1}>{statusLabel(s)}</T>
              </View>
            </View>
            <T f="h" style={{ color: "#fff", fontSize: 23, lineHeight: 29, marginTop: 14 }}>{s.title}</T>
            <T style={{ color: "rgba(255,255,255,.82)", fontSize: 12.5, lineHeight: 19, marginTop: 7 }}>{s.description}</T>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 }}>
              <Camera size={13} color="#AEEBF2" />
              <T f="bs" style={{ color: "#AEEBF2", fontSize: 11 }}>Birebir görüntülü ders</T>
              {isTeacher || isStudent ? (
                <>
                  <T style={{ color: "rgba(255,255,255,.5)", fontSize: 11 }}>·</T>
                  <T f="bs" style={{ color: "#fff", fontSize: 11 }}>{isTeacher ? "Eğitmensin" : "Öğrencisin"}</T>
                </>
              ) : null}
            </View>

            <View style={{ flexDirection: "row", gap: 9, marginTop: 14 }}>
              <InfoTile icon={<CalendarDays size={15} color="#AEEBF2" />} label={when ? when.day : "Tarih"} value={when ? when.time : "—"} />
              <InfoTile icon={<Clock size={15} color="#AEEBF2" />} label="Süre" value={s.durationMinutes ? `${s.durationMinutes} dk` : "—"} />
              <InfoTile icon={<Wallet size={15} color="#FFD66B" />} label={earnLabel} value={earn} />
            </View>
          </LinearGradient>
        </Enter>

        {/* ---- sınıf: iki koltuk ---- */}
        <Enter delay={70}>
          <LinearGradient
            colors={["#0A2A66", C.abyss]}
            style={[{ marginTop: 12, borderRadius: 24, padding: 16, overflow: "hidden" }, SH.soft]}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 12 }}>
              <Users size={14} color="#AEEBF2" />
              <T f="bb" style={{ color: "#AEEBF2", fontSize: 11.5 }}>Sınıf · en fazla 2 kişi</T>
            </View>
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <Seat role="Eğitmen" person={s.host} me={isTeacher} here={hostHere} emptyText="Eğitmen" />
              <View style={{ width: 36, alignItems: "center", paddingTop: 66 }}>
                {s.peerJoined || s.status === "Live" ? (
                  <Pulse to={1.15} duration={1000}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#22B07D" }} />
                  </Pulse>
                ) : (
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "rgba(255,255,255,.25)" }} />
                )}
              </View>
              <Seat
                role="Öğrenci"
                person={s.guest}
                me={isStudent}
                here={guestHere}
                emptyText={s.status === "Listed" ? "Boş koltuk" : "Öğrenci bekleniyor"}
              />
            </View>
            {s.status === "Live" && planned > 0 && (
              <View style={{ marginTop: 14 }}>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,.16)", overflow: "hidden" }}>
                  <View style={{ width: `${Math.round(progress * 100)}%`, height: 6, backgroundColor: C.lagoon }} />
                </View>
                <T style={{ color: "rgba(255,255,255,.75)", fontSize: 10.5, marginTop: 5, textAlign: "center" }}>
                  {formatClock(liveElapsed)} / {s.durationMinutes} dk
                </T>
              </View>
            )}
          </LinearGradient>
        </Enter>

        {/* ---- geri sayım + eylemler ---- */}
        <Enter delay={140}>
          <View
            style={[
              sessionCard,
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

            {(s.status === "Pending" || s.status === "Waiting") && (
              <Clock_
                hot
                label={s.canJoin ? "Katılmak için kalan süre" : "Ders başlamak üzere"}
                ms={left(s.joinDeadlineUtc)}
                hint={s.peerJoined ? (isTeacher ? "Öğrencin derste seni bekliyor" : "Eğitmenin derste seni bekliyor") : undefined}
              />
            )}
            {(s.status === "Booked" || s.status === "Listed") && (
              <Clock_
                label={s.status === "Booked" ? "Dersin başlamasına" : "Randevuya kalan"}
                ms={left(s.scheduledAtUtc)}
                hint={s.status === "Booked" ? "Süre dolunca Katıl düğmesi burada ve her ekranda açılır." : undefined}
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
                label="Ders süresi"
                ms={Math.max(1, liveElapsed + 1000)}
                hint={endAt && endAt > nowMs ? `Planlanan bitişe ${formatClock(endAt - nowMs)} var` : undefined}
              />
            )}

            {s.status === "Listed" && isTeacher && (
              <T style={{ textAlign: "center", color: C.muted, fontSize: 12.5, lineHeight: 18 }}>
                Eğitimin satışta. Bir öğrenci satın alınca haber veririz. Randevuya kadar satılmazsa kapanır.
              </T>
            )}
            {s.status === "Booked" && (
              <T style={{ textAlign: "center", color: C.muted, fontSize: 12.5, lineHeight: 18 }}>
                {isTeacher
                  ? "Bir öğrenci eğitimini satın aldı. Randevu saatinde uygulamayı açık tut; katılma süresi kısadır (birkaç dakika)."
                  : "Randevu saatinde uygulamayı açık tut; katılma süresi kısadır (birkaç dakika). O saate yakın başka görüşmeye girme."}
              </T>
            )}
            {s.status === "AwaitingApproval" && !payer && (
              <T style={{ textAlign: "center", color: C.muted, fontSize: 12.5 }}>Öğrencinin değerlendirmesi bekleniyor.</T>
            )}
            {s.status === "AwaitingApproval" && payer && (
              <T f="bb" style={{ textAlign: "center", fontSize: 14 }}>Eğitimden memnun kaldın mı?</T>
            )}
            {isFinal(s.status) && (
              <View style={{ alignItems: "center", gap: 6, paddingVertical: 6 }}>
                <T f="h" style={{ fontSize: 16 }}>{statusLabel(s)}</T>
                {result ? (
                  <T style={{ textAlign: "center", fontSize: 12.5, color: C.muted, lineHeight: 18 }}>{result}</T>
                ) : null}
              </View>
            )}

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
              <T style={{ textAlign: "center", color: C.error, fontSize: 11.5 }}>Yeterli kredin yok (bakiyen {p.credits}).</T>
            )}
            {!cta.enabled && cta.hint ? (
              <T style={{ textAlign: "center", color: C.muted, fontSize: 11 }}>{cta.hint}</T>
            ) : null}
            {canReview(s) && (
              <>
                <GradBtn label="Onayla" colors={G_PRIMARY} disabled={busy} onPress={() => doReview(s, true)} />
                <GradBtn label="Memnun kalmadım" colors={[C.muted, C.muted]} disabled={busy} onPress={() => doReview(s, false)} />
                <T style={{ textAlign: "center", color: C.muted, fontSize: 10.5 }}>
                  "Memnun kalmadım" dersen kredin iade edilir, eğitmen kredi kazanmaz.
                </T>
              </>
            )}
            {canEnd(s) && (
              <GradBtn label="Eğitimi bitir" colors={[C.abyss, C.deep]} disabled={busy} onPress={() => confirmEnd(s)} />
            )}
            {canCancel(s, nowMs) && (
              <GradBtn label="Eğitimi iptal et" colors={[C.coral, C.coral]} disabled={busy} onPress={() => confirmCancel(s)} />
            )}
          </View>
        </Enter>

        {/* ---- derse hazırlık ---- */}
        {upcoming && (isTeacher || isStudent) && (
          <Enter delay={210}>
            <View style={[sessionCard, SH.soft, { marginTop: 12, gap: 12 }]}>
              <T f="h" style={{ fontSize: 14.5 }}>Derse hazırlık</T>
              <Tip icon={<Camera size={17} color={C.tide} />} text="Kamera ve mikrofon izinlerini aç; ders görüntülü yapılır." />
              <Tip icon={<Wifi size={17} color={C.tide} />} text="Sağlam bir internet bağlantısında ol, mümkünse Wi-Fi kullan." />
              <Tip icon={<Volume2 size={17} color={C.tide} />} text="Sessiz bir ortam seç; kulaklık ses kalitesini artırır." />
              <Tip icon={<BellRing size={17} color={C.tide} />} text="Randevu saatinde uygulamayı açık tut; katılma süresi kısadır." />
              {isTeacher && <Tip icon={<Mic size={17} color={C.tide} />} text="Konuyu önceden gözden geçir; ders yalnızca iki kişiliktir, süre akar." />}
            </View>
          </Enter>
        )}

        <Enter delay={280}>
          <View style={[sessionCard, SH.soft, { marginTop: 12, paddingVertical: 18 }]}>
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
        refreshControl={<RefreshControl refreshing={q.isRefetching && !q.isLoading} onRefresh={() => q.refetch()} tintColor={C.tide} />}
      >
        {header}
        {body()}
      </ScrollView>
    </View>
  );
}
