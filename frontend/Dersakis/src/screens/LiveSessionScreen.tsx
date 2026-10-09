import React from "react";
import { ActivityIndicator, Alert, ScrollView, View } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { C, G_PRIMARY, SH } from "@/theme";
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
  statusLabel,
} from "@/utils/live";
import { formatCountdown, formatDateTime, toDate } from "@/utils/time";
import { colorFor, initialsOf } from "@/utils/user";
import { Avatar, GradBtn, MiniPill, Press, T } from "@/components/ui";

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

const card = { backgroundColor: "#fff", borderRadius: 18, padding: 15 } as const;

function Person({ label, p }: { label: string; p: LiveSessionDto["host"] | null }) {
  if (!p) return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 }}>
      <Avatar
        initials={initialsOf(p.displayName)}
        color={colorFor(p.id)}
        uri={p.avatarUrl ? absoluteUrl(p.avatarUrl) : null}
        size={34}
      />
      <View>
        <T f="bb" style={{ fontSize: 12 }}>
          {p.displayName}
        </T>
        <T style={{ fontSize: 10, color: C.muted }}>{label}</T>
      </View>
    </View>
  );
}

function Clock({
  label,
  ms,
  hint,
}: {
  label: string;
  ms: number;
  hint?: string;
}) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 8 }}>
      <T style={{ color: C.muted, fontSize: 11 }}>{label}</T>
      <T f="h" style={{ fontSize: 32, color: C.tide, marginTop: 2 }}>
        {ms > 0 ? formatCountdown(ms) : "Güncelleniyor…"}
      </T>
      {hint ? <T style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{hint}</T> : null}
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

  const confirmBook = (x: LiveSessionDto) =>
    Alert.alert(
      "Eğitimi satın al",
      `${x.price} kredi düşecek. Eğitim ${formatDateTime(x.scheduledAtUtc!)} tarihinde.`,
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
      <T f="h" style={{ fontSize: 20, flex: 1 }} numberOfLines={1}>
        {s ? (s.kind === "Lesson" ? "Eğitim" : "Sesli soru") : "Oturum"}
      </T>
      {s && <MiniPill label={statusLabel(s)} color={C.tide} bg="#EAF3FF" />}
    </View>
  );

  const body = () => {
    if (q.isLoading)
      return (
        <View style={{ padding: 40, alignItems: "center" }}>
          <ActivityIndicator color={C.tide} />
        </View>
      );
    if (!s)
      return (
        <View style={{ gap: 12 }}>
          <T style={{ color: C.error }}>{errorMessage(q.error)}</T>
          <GradBtn label="Tekrar dene" small onPress={() => q.refetch()} />
        </View>
      );

    const lesson = s.kind === "Lesson";
    const payer = isPayer(s);
    const nowMs = clock.now();
    const left = (iso: string | null) => (iso ? clock.remainingMs(iso) : 0);
    const result = outcomeText(s);
    const peer = s.myRole === "host" ? s.guest : s.host;

    return (
      <>
        <View style={[card, SH.soft]}>
          <T f="bb" style={{ color: C.tide, fontSize: 11 }}>
            {s.courseName.toUpperCase()}
          </T>
          <T f="h" style={{ fontSize: 20, lineHeight: 25, marginTop: 5 }}>
            {s.title}
          </T>
          <T style={{ color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 6 }}>
            {s.description}
          </T>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
            <MiniPill label={lesson ? "Görüntülü" : "Sesli"} color={C.tide} />
            {lesson && s.scheduledAtUtc && <MiniPill label={formatDateTime(s.scheduledAtUtc)} />}
            {lesson && s.durationMinutes ? <MiniPill label={`${s.durationMinutes} dk`} /> : null}
            <MiniPill
              label={
                payer
                  ? `${s.price} kredi ödedin`
                  : s.myRole === "none"
                    ? lesson
                      ? `${s.price} kredi`
                      : `+${s.payout} kredi kazanırsın`
                    : `+${lesson ? s.price : s.payout} kredi kazanırsın`
              }
            />
          </View>
          <Person label={lesson ? "Eğitmen" : "Soran"} p={s.host} />
          <Person label={lesson ? "Öğrenci" : "Cevaplayan"} p={s.guest} />
        </View>

        <View style={[card, SH.soft, { marginTop: 12, gap: 10 }]}>
          {/* ---- geri sayımlar ---- */}
          {(s.status === "Pending" || s.status === "Waiting") && (
            <Clock
              label="Katılmak için kalan süre"
              ms={left(s.joinDeadlineUtc)}
              hint={s.peerJoined ? "Karşı taraf katıldı" : undefined}
            />
          )}
          {(s.status === "Booked" || s.status === "Listed") && lesson && (
            <Clock label="Randevuya kalan" ms={left(s.scheduledAtUtc)} />
          )}
          {s.status === "AwaitingApproval" && (
            <Clock
              label="Otomatik onaya kalan"
              ms={left(s.approvalDeadlineUtc)}
              hint={payer ? "Yanıtlamazsan onaylanmış sayılır" : undefined}
            />
          )}
          {s.status === "Live" && s.liveStartedAtUtc && (
            <Clock
              label="Görüşme süresi"
              ms={Math.max(1, nowMs - toDate(s.liveStartedAtUtc).getTime() + 1000)}
            />
          )}

          {/* ---- durum metinleri ---- */}
          {s.status === "Open" && s.myRole === "host" && (
            <T style={{ textAlign: "center", color: C.muted, fontSize: 12 }}>
              Birinin katılması bekleniyor. Ekranı kapatsan da ilanın açık kalır.
            </T>
          )}
          {s.status === "Pending" && s.myRole === "guest" && (
            <T style={{ textAlign: "center", color: C.muted, fontSize: 12 }}>
              İlan sahibi bekleniyor. Gelmezse kredi iade edilir.
            </T>
          )}
          {s.status === "Listed" && s.myRole === "host" && (
            <T style={{ textAlign: "center", color: C.muted, fontSize: 12 }}>
              Eğitimin satışta. Randevuya kadar satılmazsa kapanır.
            </T>
          )}
          {s.status === "Booked" && (
            <T style={{ textAlign: "center", color: C.muted, fontSize: 12 }}>
              Randevu saatinde buradan katılabilirsin. O saate yakın başka görüşmeye girme.
            </T>
          )}
          {s.status === "AwaitingApproval" && !payer && (
            <T style={{ textAlign: "center", color: C.muted, fontSize: 12 }}>
              Değerlendirme bekleniyor.
            </T>
          )}
          {s.status === "AwaitingApproval" && payer && (
            <T style={{ textAlign: "center", fontSize: 13 }}>
              {lesson ? "Eğitimden memnun kaldın mı?" : "Cevabı aldın mı?"}
            </T>
          )}
          {isFinal(s.status) && (
            <T f="bb" style={{ textAlign: "center", fontSize: 13 }}>
              {result ?? statusLabel(s)}
            </T>
          )}

          {/* ---- eylemler ---- */}
          {s.canBook && (
            <GradBtn
              label={`Satın al · ${s.price} ✦`}
              disabled={busy || p.credits < s.price}
              onPress={() => confirmBook(s)}
            />
          )}
          {s.canBook && p.credits < s.price && (
            <T style={{ textAlign: "center", color: C.error, fontSize: 11 }}>
              Yeterli kredin yok (bakiyen {p.credits}).
            </T>
          )}
          {s.canJoin && (
            <GradBtn
              label={s.kind === "Voice" && s.myRole === "none" ? `Cevapla · +${s.payout} ✦` : "Katıl"}
              disabled={busy}
              onPress={() => p.onJoin(s)}
            />
          )}
          {canEnd(s) && (
            <GradBtn label="Görüşmeyi bitir" disabled={busy} onPress={() => confirmEnd(s)} />
          )}
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
              <T style={{ textAlign: "center", color: C.muted, fontSize: 10 }}>
                "Memnun kalmadım" dersen krediniz iade edilir, karşı taraf kredi kazanmaz.
              </T>
            </>
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
        {peer && s.status === "Live" && (
          <T style={{ textAlign: "center", color: C.muted, fontSize: 11, marginTop: 10 }}>
            {peer.displayName} ile görüşüyorsun.
          </T>
        )}
      </>
    );
  };

  return (
    <View style={{ flex: 1, paddingTop: p.topInset + 12 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: p.bodyPad }}
      >
        {header}
        {body()}
      </ScrollView>
    </View>
  );
}
