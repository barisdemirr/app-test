import React, { useState } from "react";
import { View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { C, G_PRIMARY } from "@/theme";
import { errorMessage } from "@/api/errors";
import type { RedeemResult, RewardItem } from "@/api/rewards";
import { useRedeem } from "@/queries";
import { GradBtn, Sheet, T } from "@/components/ui";

export function CodeBox({ code, onCopied }: { code: string; onCopied: () => void }) {
  return (
    <View style={{ gap: 10 }}>
      <View
        style={{
          padding: 16,
          borderRadius: 15,
          backgroundColor: "#fff",
          alignItems: "center",
          borderWidth: 1,
          borderColor: C.mist,
        }}
      >
        <T f="h" selectable style={{ fontSize: 22, letterSpacing: 2, color: C.tide }}>
          {code}
        </T>
      </View>
      <GradBtn
        label="Kodu kopyala"
        small
        colors={G_PRIMARY}
        onPress={async () => {
          await Clipboard.setStringAsync(code);
          onCopied();
        }}
      />
    </View>
  );
}

/** Onay → satın alma → kod gösterimi. */
export function RedeemSheet({
  reward,
  credits,
  toast,
  onClose,
  showToast,
}: {
  reward: RewardItem;
  credits: number;
  toast: string;
  onClose: () => void;
  showToast: (m: string) => void;
}) {
  const redeem = useRedeem();
  const [done, setDone] = useState<RedeemResult | null>(null);
  const [error, setError] = useState("");

  const confirm = () => {
    setError("");
    redeem.mutate(reward.id, {
      onSuccess: setDone,
      onError: (e) => setError(errorMessage(e)),
    });
  };

  return (
    <Sheet onClose={onClose} toast={toast}>
      {done ? (
        <View style={{ gap: 12 }}>
          <T f="h" style={{ fontSize: 21 }}>
            Ödülün hazır 🎉
          </T>
          <T style={{ color: C.muted, fontSize: 12 }}>
            {done.title} için kupon kodun aşağıda. Kodu "Aldığım ödüller" listesinde de
            bulabilirsin. Kalan bakiyen: {done.balance} kredi.
          </T>
          <CodeBox code={done.code} onCopied={() => showToast("Kod kopyalandı")} />
          <GradBtn label="Tamam" colors={G_PRIMARY} onPress={onClose} />
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          <T f="h" style={{ fontSize: 21 }}>
            {reward.title}
          </T>
          <T style={{ color: C.muted, fontSize: 12, lineHeight: 18 }}>
            {reward.description}
          </T>
          <T f="bb" style={{ fontSize: 13 }}>
            {reward.cost} kredi düşecek · bakiyen {credits}
          </T>
          {error ? (
            <T f="bs" style={{ color: C.error, fontSize: 12 }}>
              {error}
            </T>
          ) : null}
          <GradBtn
            label={redeem.isPending ? "Alınıyor…" : "Onayla ve al"}
            colors={G_PRIMARY}
            disabled={redeem.isPending || credits < reward.cost}
            onPress={confirm}
          />
        </View>
      )}
    </Sheet>
  );
}
