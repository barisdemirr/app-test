import React, { useEffect, useState } from "react";
import { View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { Plus } from "lucide-react-native";
import { C, SH } from "@/theme";
import { absoluteUrl } from "@/config";
import { errorMessage } from "@/api/errors";
import { useAvatar, useProfile, useUpdateProfile } from "@/queries";
import { colorFor, initialsOf } from "@/utils/user";
import { Avatar, Chip, Field, GradBtn, Press, Skeleton, T } from "@/components/ui";

/** Avatar + ad + hakkımda. Sunucudaki /me/profile'dan beslenir. */
export function ProfileHeader({ showToast }: { showToast: (m: string) => void }) {
  const profileQ = useProfile();
  const update = useUpdateProfile();
  const { upload, remove } = useAvatar();
  const profile = profileQ.data;

  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  // sunucudan gelen değer değişince (ilk yükleme, kayıt sonrası) alanları eşitle
  useEffect(() => {
    if (profile) {
      setName(profile.displayName);
      setAbout(profile.about ?? "");
    }
  }, [profile?.displayName, profile?.about]);

  if (!profile) {
    return (
profileQ.isError ? (
        <T style={{ color: C.error, fontSize: 12, paddingVertical: 24 }}>{errorMessage(profileQ.error)}</T>
      ) : (
        <View style={{ gap: 10, paddingVertical: 16 }}><Skeleton style={{ height: 72, width: 72, borderRadius: 36 }} /><Skeleton style={{ height: 18, width: 160 }} /><Skeleton style={{ height: 12, width: 220 }} /></View>
      )
    );
  }

  const nameOk = name.trim().length >= 2 && name.trim().length <= 40;
  const dirty =
    name.trim() !== profile.displayName || about.trim() !== (profile.about ?? "");
  const busyAvatar = upload.isPending || remove.isPending;

  const pickPhoto = async () => {
    try {
      const r = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (r.canceled || !r.assets[0]) return;
      // 2 MB sınırı için küçült: sunucu zaten 256×256'ya kırpıyor
      const small = await manipulateAsync(r.assets[0].uri, [{ resize: { width: 512 } }], {
        compress: 0.8,
        format: SaveFormat.JPEG,
      });
      upload.mutate(small.uri, {
        onSuccess: () => showToast("Fotoğrafın güncellendi"),
        onError: (e) => showToast(errorMessage(e)),
      });
    } catch {
      showToast("Fotoğraf seçilemedi");
    }
  };

  const save = () => {
    if (!nameOk) return showToast("Ad 2-40 karakter olmalı");
    update.mutate(
      { displayName: name.trim(), about: about.trim() },
      {
        onSuccess: () => showToast("Profilin kaydedildi"),
        onError: (e) => showToast(errorMessage(e)),
      },
    );
  };

  return (
    <>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 13,
          paddingTop: 10,
          paddingBottom: 13,
        }}
      >
        <View style={{ opacity: busyAvatar ? 0.5 : 1 }}>
          <Avatar
            initials={initialsOf(profile.displayName)}
            color={colorFor(profile.id)}
            uri={profile.avatarUrl ? absoluteUrl(profile.avatarUrl) : null}
            size={70}
          />
          <Press
            onPress={busyAvatar ? undefined : pickPhoto}
            style={{
              position: "absolute",
              right: -3,
              bottom: -2,
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: C.coral,
              borderWidth: 2,
              borderColor: "#fff",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Plus size={14} color="#fff" />
          </Press>
        </View>
        <View style={{ flex: 1 }}>
          <T f="h" style={{ fontSize: 22 }} numberOfLines={1}>
            {profile.displayName}
          </T>
          <T style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>
            {profile.content.videos} video · {profile.content.learnedByOthers} kişi öğrendi
          </T>
          {profile.avatarUrl && (
            <View style={{ alignSelf: "flex-start", marginTop: 6 }}>
              <Chip
                onPress={
                  busyAvatar
                    ? undefined
                    : () =>
                        remove.mutate(undefined, {
                          onSuccess: () => showToast("Fotoğrafın kaldırıldı"),
                          onError: (e) => showToast(errorMessage(e)),
                        })
                }
              >
                Fotoğrafı kaldır
              </Chip>
            </View>
          )}
        </View>
      </View>

      <View style={[{ backgroundColor: "#fff", padding: 14, borderRadius: 18 }, SH.soft]}>
        <Field label="Ad" value={name} onChange={setName} maxLength={40} />
        <Field
          label="Kısa biyografi"
          value={about}
          onChange={setAbout}
          multiline
          maxLength={160}
        />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: -7,
          }}
        >
          <T style={{ color: C.muted, fontSize: 10 }}>{about.length}/160</T>
          <GradBtn
            label={update.isPending ? "Kaydediliyor…" : "Kaydet"}
            small
            colors={[C.tide, C.tide]}
            radius={{ borderRadius: 11 }}
            disabled={!dirty || update.isPending}
            onPress={save}
          />
        </View>
      </View>
    </>
  );
}
