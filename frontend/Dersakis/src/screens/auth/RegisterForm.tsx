import React, { useState } from "react";
import { View } from "react-native";
import { C, G_PRIMARY } from "@/theme";
import { Field, GradBtn, Press, T } from "@/components/ui";
import { registerUser, requestPhoneCode } from "@/api/auth";
import { errorCode, errorMessage } from "@/api/errors";
import { useAuth } from "@/auth";
import { useCountdown } from "@/hooks/useCountdown";
import { cleanPhone, isValidTrMobile } from "@/utils/phone";

type Props = { onGoLogin: () => void };

export function RegisterForm({ onGoLogin }: Props) {
  const { signIn } = useAuth();
  const [step, setStep] = useState<"phone" | "details">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [invite, setInvite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [codeError, setCodeError] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [phoneTaken, setPhoneTaken] = useState(false);
  const resend = useCountdown();

  const sendCode = async () => {
    if (busy || resend.left > 0) return;
    if (!isValidTrMobile(phone)) return setError("Geçerli bir cep telefonu numarası gir.");
    setError("");
    setPhoneTaken(false);
    setBusy(true);
    try {
      const r = await requestPhoneCode(cleanPhone(phone));
      resend.start(r.resendAfterSeconds);
      // devCode yalnızca geliştirmede dolu gelir; canlıda arayüzde gösterilmez.
      if (__DEV__ && r.devCode) setCode(r.devCode);
      setStep("details");
    } catch (e) {
      if (errorCode(e) === "phone_taken") setPhoneTaken(true);
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (busy) return;
    setError("");
    setCodeError("");
    setInviteError("");
    if (!/^\d{4,8}$/.test(code.trim())) return setCodeError("SMS kodunu gir.");
    if (password.length < 8 || password.length > 128)
      return setError("Şifre 8-128 karakter olmalı.");
    const n = name.trim();
    if (n.length < 2 || n.length > 40) return setError("Ad 2-40 karakter olmalı.");

    setBusy(true);
    try {
      const res = await registerUser({
        phone: cleanPhone(phone),
        code: code.trim(),
        password,
        displayName: n,
        inviteCode: invite.trim() || undefined,
      });
      await signIn(res);
    } catch (e) {
      const c = errorCode(e);
      if (c === "code_invalid" || c === "code_expired" || c === "code_attempts_exceeded")
        setCodeError(errorMessage(e));
      else if (c === "invite_code_invalid" || c === "invite_code_exhausted")
        setInviteError(errorMessage(e));
      else if (c === "phone_taken") {
        setPhoneTaken(true);
        setError(errorMessage(e));
      } else setError(errorMessage(e));
      setBusy(false);
    }
  };

  const goodbye = phoneTaken ? (
    <Press onPress={onGoLogin} style={{ paddingVertical: 8 }}>
      <T f="bb" style={{ color: C.tide, fontSize: 12 }}>
        Bu numarayla hesap var, giriş yap
      </T>
    </Press>
  ) : null;

  if (step === "phone") {
    return (
      <View>
        <Field
          label="Telefon"
          value={phone}
          onChange={setPhone}
          placeholder="05xx xxx xx xx"
          inputProps={{ keyboardType: "phone-pad", autoComplete: "tel", maxLength: 17 }}
        />
        {error ? (
          <T f="bs" style={{ color: C.error, fontSize: 12, marginBottom: 10 }}>
            {error}
          </T>
        ) : null}
        {goodbye}
        <GradBtn
          label={busy ? "Kod gönderiliyor..." : "SMS kodu gönder"}
          colors={G_PRIMARY}
          disabled={busy}
          onPress={sendCode}
        />
      </View>
    );
  }

  return (
    <View>
      <T style={{ color: C.muted, fontSize: 12, marginBottom: 14 }}>
        {cleanPhone(phone)} numarasına gönderilen kodu gir.
      </T>
      <Field
        label="SMS kodu"
        value={code}
        onChange={setCode}
        placeholder="6 haneli kod"
        error={codeError}
        inputProps={{ keyboardType: "number-pad", maxLength: 8 }}
      />
      <Field
        label="Şifre"
        value={password}
        onChange={setPassword}
        placeholder="En az 8 karakter"
        inputProps={{ secureTextEntry: true, autoCapitalize: "none", maxLength: 128 }}
      />
      <Field
        label="Ad"
        value={name}
        onChange={setName}
        placeholder="Nasıl görünmek istersin?"
        maxLength={40}
      />
      <Field
        label="Davet kodu (isteğe bağlı)"
        value={invite}
        onChange={(v) => setInvite(v.toUpperCase())}
        placeholder="ABCD2345"
        error={inviteError}
        inputProps={{ autoCapitalize: "characters", maxLength: 16 }}
      />
      {error ? (
        <T f="bs" style={{ color: C.error, fontSize: 12, marginBottom: 10 }}>
          {error}
        </T>
      ) : null}
      {goodbye}
      <GradBtn
        label={busy ? "Kaydediliyor..." : "Kayıt ol"}
        colors={G_PRIMARY}
        disabled={busy}
        onPress={submit}
      />
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
        <Press onPress={() => setStep("phone")} style={{ padding: 8 }}>
          <T f="bb" style={{ color: C.muted, fontSize: 12 }}>
            Numarayı değiştir
          </T>
        </Press>
        <Press onPress={sendCode} disabled={resend.left > 0 || busy} style={{ padding: 8 }}>
          <T f="bb" style={{ color: resend.left > 0 ? C.muted : C.tide, fontSize: 12 }}>
            {resend.left > 0 ? `Tekrar gönder (${resend.left})` : "Kodu tekrar gönder"}
          </T>
        </Press>
      </View>
    </View>
  );
}
