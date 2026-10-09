import React, { useEffect, useState } from "react";
import { Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { C, DIAG } from "@/theme";
import { T } from "./T";

/**
 * `uri` verilirse profil fotoğrafı gösterilir; yüklenemezse (ya da yoksa)
 * baş harfli gradyan avatara düşer.
 */
export function Avatar({
  initials,
  color,
  size = 40,
  uri,
}: {
  initials: string;
  color: string;
  size?: number;
  uri?: string | null;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);

  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        onError={() => setFailed(true)}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,.25)",
          backgroundColor: C.deep,
        }}
      />
    );
  }

  return (
    <LinearGradient
      colors={[color, C.deep]}
      {...DIAG}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,.25)",
      }}
    >
      <T f="bb" style={{ color: "#fff", fontSize: size * 0.32 }}>
        {initials}
      </T>
    </LinearGradient>
  );
}
