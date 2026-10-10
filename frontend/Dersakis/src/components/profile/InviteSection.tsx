import React from "react";
import { Share, View } from "react-native";
import { C, SH } from "@/theme";
import { useReferral } from "@/queries";
import { formatDateTime } from "@/utils/time";
import { GradBtn, SectionTitle, T } from "@/components/ui";

/** Davet kodu: arkadaşını getir, ikiniz de kredi kazanın (günlük tavana sayılmaz). */
export function InviteSection() {
  const { data: r } = useReferral();
  if (!r) return null;

  const share = () =>
    Share.share({
      message: `Dolphora'da ders çalış, kredi kazan! Davet kodum: ${r.inviteCode}`,
    }).catch(() => {});

  return (
    <>
      <SectionTitle title="Arkadaşını davet et" />
      <View style={[{ padding: 14, borderRadius: 17, backgroundColor: "#fff", gap: 8 }, SH.soft]}>
        <T style={{ color: C.muted, fontSize: 11, lineHeight: 16 }}>
          Kodunla katılan her arkadaşın için sen {r.inviterReward}, o {r.inviteeReward} kredi
          kazanır.
        </T>
        <T f="h" selectable style={{ fontSize: 24, letterSpacing: 3, color: C.tide }}>
          {r.inviteCode}
        </T>
        <T style={{ color: C.muted, fontSize: 11 }}>
          {r.used}/{r.maxInvites} davet kullanıldı · {r.remaining} hakkın kaldı
        </T>
        {r.invited.map((i) => (
          <T key={i.displayName + i.joinedAtUtc} style={{ fontSize: 11 }}>
            • {i.displayName} · {formatDateTime(i.joinedAtUtc)}
          </T>
        ))}
        <GradBtn label="Kodu paylaş" small onPress={share} disabled={r.remaining === 0} />
      </View>
    </>
  );
}
