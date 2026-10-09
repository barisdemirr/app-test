import React from "react";
import { ScrollView, TextInput, View } from "react-native";
import { CheckCircle2, Upload } from "lucide-react-native";
import { C, fin, FONT, G_PRIMARY, SH } from "@/theme";
import { useCourseNames } from "@/queries";
import type { PickedVideo } from "@/utils/videoForm";
import type { UploadPhase } from "@/hooks/useVideoUpload";
import {
  Chip,
  Field,
  GradBtn,
  Press,
  Sonar,
  T,
} from "@/components/ui";

export type QForm = {
  q: string;
  correct: string;
  wrong: string[];
  exp: string;
};

export const emptyQ = (): QForm => ({
  q: "",
  correct: "",
  wrong: ["", "", ""],
  exp: "",
});

export type CreateScreenProps = {
  bodyPad: number;
  video: PickedVideo | null;
  uploadPhase: UploadPhase;
  /** 0..1 */
  uploadProgress: number;
  formTitle: string;
  formTopic: string;
  formCourse: string;
  q1: QForm;
  q2: QForm;
  showQ2: boolean;
  formError: string;
  onSelectVideo: () => void;
  onFormTitle: (v: string) => void;
  onFormTopic: (v: string) => void;
  onFormCourse: (c: string) => void;
  onQ1: (q: QForm) => void;
  onQ2: (q: QForm) => void;
  onShowQ2: () => void;
  onPublish: () => void;
};

export function CreateScreen(p: CreateScreenProps) {
  const courses = useCourseNames();
  const busy = p.uploadPhase !== "idle";
  const mmss = (ms: number) =>
    `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;
  const scrollProps = {
    showsVerticalScrollIndicator: false,
    keyboardShouldPersistTaps: "handled" as const,
    automaticallyAdjustKeyboardInsets: true,
    contentContainerStyle: {
      paddingHorizontal: 20,
      paddingBottom: p.bodyPad,
    },
  };

  const questionForm = (q: QForm, set: (q: QForm) => void) => (
    <>
      <Field
        label="Soru"
        value={q.q}
        onChange={(v) => set({ ...q, q: v })}
        placeholder="Öğrencine ne sormak istersin?"
      />
      <Field
        label="Doğru cevap"
        value={q.correct}
        onChange={(v) => set({ ...q, correct: v })}
        placeholder="Doğru seçenek"
      />
      <T f="bb" style={{ color: C.muted, fontSize: 12, marginBottom: 8 }}>
        Yanlış seçenekler
      </T>
      {q.wrong.map((w, i) => (
        <TextInput
          key={i}
          value={w}
          onChangeText={(v) =>
            set({ ...q, wrong: q.wrong.map((x, j) => (j === i ? v : x)) })
          }
          placeholder={`Yanlış seçenek ${i + 1}`}
          placeholderTextColor="#9AA9BD"
          style={{
            height: 44,
            borderRadius: 13,
            borderWidth: 1,
            borderColor: C.mist,
            backgroundColor: "#fff",
            paddingHorizontal: 12,
            fontFamily: FONT.b,
            fontSize: 13,
            color: C.ink,
            marginBottom: 8,
          }}
        />
      ))}
      <View style={{ height: 6 }} />
      <Field
        label="Kısa açıklama (isteğe bağlı)"
        value={q.exp}
        onChange={(v) => set({ ...q, exp: v })}
        placeholder="Cevabın neden doğru olduğunu açıkla"
        multiline
      />
    </>
  );

  const card = {
    padding: 15,
    borderRadius: 20,
    backgroundColor: "#fff",
    marginBottom: 13,
  };

  return (
    <ScrollView {...scrollProps}>
      <T f="h" style={{ fontSize: 25, marginTop: 8, marginBottom: 5 }}>
        İçerik üret
      </T>
      <T
        style={{
          fontSize: 12,
          lineHeight: 18,
          color: C.muted,
          marginBottom: 17,
        }}
      >
        20 saniye ile 2 dakika arasında bir video yükle. Videonun sonuna en
        fazla 2 soru ekleyebilirsin.
      </T>

      <View
        style={[
          fin,
          {
            borderWidth: 1.5,
            borderStyle: "dashed",
            borderColor: "#A9C4E6",
            backgroundColor: "#EEF6FF",
            padding: 20,
            alignItems: "center",
            marginBottom: 14,
            overflow: "hidden",
          },
        ]}
      >
        <View style={{ position: "absolute", top: 10, opacity: 0.5 }}>
          <Sonar size={120} color="rgba(27,107,255,.18)" />
        </View>
        <View
          style={[
            {
              width: 42,
              height: 42,
              backgroundColor: "#fff",
              borderRadius: 15,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 8,
            },
            SH.soft,
          ]}
        >
          <Upload size={19} color={C.tide} />
        </View>
        {p.video ? (
          <View style={{ alignSelf: "stretch", gap: 10 }}>
            <View
              style={{
                padding: 10,
                borderRadius: 13,
                backgroundColor: "#fff",
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <CheckCircle2 size={18} color={C.success} />
              <View style={{ flex: 1 }}>
                <T f="bb" style={{ fontSize: 12 }} numberOfLines={1}>
                  {p.video.name}
                </T>
                <T style={{ color: C.success, fontSize: 10 }}>
                  {p.video.durationMs != null ? `${mmss(p.video.durationMs)} · ` : ""}
                  {p.video.sizeBytes != null
                    ? `${(p.video.sizeBytes / 1048576).toFixed(1)} MB · `
                    : ""}
                  uygun
                </T>
              </View>
            </View>
            {!busy && (
              <GradBtn
                label="Başka video seç"
                small
                colors={G_PRIMARY}
                radius={{ borderRadius: 12 }}
                onPress={p.onSelectVideo}
              />
            )}
          </View>
        ) : (
          <>
            <T f="bb" style={{ fontSize: 14 }}>
              Dersini kısa ve öz anlat
            </T>
            <T
              style={{
                color: C.muted,
                fontSize: 11,
                marginTop: 5,
                marginBottom: 10,
              }}
            >
              MP4 · 20 sn – 2 dk · en çok 100 MB
            </T>
            <GradBtn
              label="Video seç"
              small
              colors={G_PRIMARY}
              radius={{ borderRadius: 12 }}
              onPress={p.onSelectVideo}
            />
          </>
        )}
      </View>

      <View style={[card, SH.soft]}>
        <Field
          label="Başlık · en fazla 70 karakter"
          value={p.formTitle}
          onChange={p.onFormTitle}
          placeholder="Örn. Limitin temel mantığı"
          maxLength={70}
        />
        <T f="bb" style={{ fontSize: 12, color: C.muted, marginBottom: 7 }}>
          Ders
        </T>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 7,
            marginBottom: 14,
          }}
        >
          {courses.map((c) => (
            <Chip
              key={c}
              active={p.formCourse === c}
              onPress={() => p.onFormCourse(c)}
            >
              {c}
            </Chip>
          ))}
        </View>
        <Field
          label="Konu · en fazla 40 karakter"
          value={p.formTopic}
          onChange={p.onFormTopic}
          placeholder="Örn. Belirsiz ifadeler"
          maxLength={40}
        />
      </View>

      <View style={[card, SH.soft]}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: 11,
          }}
        >
          <T f="bb" style={{ fontSize: 15 }}>
            Soru 1
          </T>
          <T f="bb" style={{ color: C.coral, fontSize: 11 }}>
            zorunlu
          </T>
        </View>
        {questionForm(p.q1, p.onQ1)}
      </View>

      <View style={[card, SH.soft]}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginBottom: p.showQ2 ? 11 : 8,
          }}
        >
          <T f="bb" style={{ fontSize: 15 }}>
            Soru 2
          </T>
          <T style={{ color: C.muted, fontSize: 11 }}>isteğe bağlı</T>
        </View>
        {p.showQ2 ? (
          questionForm(p.q2, p.onQ2)
        ) : (
          <Press
            onPress={p.onShowQ2}
            style={{
              minHeight: 44,
              borderRadius: 13,
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: C.mist,
              backgroundColor: C.foam,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <T f="bb" style={{ color: C.tide }}>
              ＋ İkinci soru ekle
            </T>
          </Press>
        )}
      </View>

      {p.formError ? (
        <T f="bs" style={{ color: C.error, fontSize: 12, marginBottom: 10 }}>
          {p.formError}
        </T>
      ) : null}
      {busy && (
        <View style={{ marginBottom: 12 }}>
          <View
            style={{ height: 6, borderRadius: 8, backgroundColor: C.mist, overflow: "hidden" }}
          >
            <View
              style={{
                width: `${Math.round(
                  (p.uploadPhase === "uploading" ? p.uploadProgress : 0) * 100,
                )}%`,
                height: 6,
                backgroundColor: C.tide,
              }}
            />
          </View>
          <T style={{ color: C.muted, fontSize: 11, marginTop: 6 }}>
            Yükleme bitene kadar uygulamayı açık tut.
          </T>
        </View>
      )}
      <GradBtn
        label={
          p.uploadPhase === "creating"
            ? "Hazırlanıyor…"
            : p.uploadPhase === "uploading"
              ? `Yükleniyor %${Math.round(p.uploadProgress * 100)}`
              : "Yayınla"
        }
        disabled={busy}
        onPress={p.onPublish}
        style={[{ marginBottom: 15 }, SH.soft]}
      />
    </ScrollView>
  );
}