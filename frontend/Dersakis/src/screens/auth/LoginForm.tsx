import React, { useState } from "react";
import { View } from "react-native";
import { C, G_PRIMARY } from "@/theme";
import { Field, GradBtn, T } from "@/components/ui";
import { loginUser } from "@/api/auth";
import { ApiError } from "@/api/http";
import { errorMessage } from "@/api/errors";
import { useAuth } from "@/auth";
import { useCountdown } from "@/hooks/useCountdown";
import { cleanPhone, isValidTrMobile } from "@/utils/phone";

export function LoginForm() {
  const { signIn } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useCountdown();

  const submit = async () => {
    if (busy || lock.left > 0) return;
    if (!isValidTrMobile(phone)) return setError("Geçerli bir cep telefonu numarası gir.");
    if (!password) return setError("Şifreni gir.");
    setError("");
    setBusy(true);
    try {
      const res = await loginUser(cleanPhone(phone), password);
      await signIn(res);
    } catch (e) {
      if (e instanceof ApiError && e.code === "account_locked") {
        lock.start(e.retryAfter ?? 900);
      }
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  const locked = lock.left > 0;
  const mm = Math.floor(lock.left / 60);
  const ss = String(lock.left % 60).padStart(2, "0");

  return (
    <View>
      <Field
        label="Telefon"
        value={phone}
        onChange={setPhone}
        placeholder="05xx xxx xx xx"
        inputProps={{ keyboardType: "phone-pad", autoComplete: "tel", maxLength: 17 }}
      />
      <Field
        label="Şifre"
        value={password}
        onChange={setPassword}
        placeholder="Şifren"
        inputProps={{ secureTextEntry: true, autoCapitalize: "none", autoComplete: "password" }}
      />
      {error ? (
        <T f="bs" style={{ color: C.error, fontSize: 12, marginBottom: 10 }}>
          {error}
        </T>
      ) : null}
      {locked ? (
        <T style={{ color: C.muted, fontSize: 12, marginBottom: 10 }}>
          Hesap geçici olarak kilitli. Kalan süre: {mm}:{ss}
        </T>
      ) : null}
      <GradBtn
        label={busy ? "Giriş yapılıyor..." : "Giriş yap"}
        colors={G_PRIMARY}
        disabled={busy || locked}
        onPress={submit}
      />
    </View>
  );
}
