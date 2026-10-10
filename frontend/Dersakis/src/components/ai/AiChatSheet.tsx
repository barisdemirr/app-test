import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, G_PRIMARY, shadow } from "@/theme";
import { T } from "@/components/ui/T";
import { Press } from "@/components/ui/Press";
import { Dolphin } from "@/components/mascot";
import { ApiError } from "@/api/http";
import { useAiChat } from "@/queries";
import { AiMessageBody } from "./AiMessageBody";
import { AI_QUICK_PROMPTS, type AiMessage } from "./types";

const MAX_CHARS = 500;
let seq = 0;
const nid = () => `m${Date.now().toString(36)}${seq++}`;

function Typing() {
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    const loops = dots.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(v, { toValue: 1, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 320, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.delay((2 - i) * 150),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [dots]);
  return (
    <View style={{ flexDirection: "row", gap: 5, paddingVertical: 6 }}>
      {dots.map((v, i) => (
        <Animated.View
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: C.tide,
            opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
            transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
          }}
        />
      ))}
    </View>
  );
}

/**
 * Dolphy sohbeti. Mesajlar üst bileşende tutulur (kapatıp açınca sohbet kaybolmasın).
 * Hazır mesaj çipleri her zaman en üstte sabit durur; dokununca doğrudan gönderilir.
 */
export function AiChatSheet({
  messages,
  setMessages,
  onClose,
}: {
  messages: AiMessage[];
  setMessages: React.Dispatch<React.SetStateAction<AiMessage[]>>;
  onClose: () => void;
}) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const chat = useAiChat();
  const [draft, setDraft] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const scroller = useRef<ScrollView>(null);
  const y = useRef(new Animated.Value(600)).current;
  const busy = chat.isPending;

  useEffect(() => {
    Animated.spring(y, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 16 }).start();
  }, [y]);

  const lastModel = [...messages].reverse().find((m) => m.role === "model" && m.res);
  const chips = lastModel?.res?.suggestions?.length ? lastModel.res.suggestions : AI_QUICK_PROMPTS;

  const send = (raw: string) => {
    const text = raw.trim().slice(0, MAX_CHARS);
    if (!text || busy) return;
    const userMsg: AiMessage = { id: nid(), role: "user", text };
    // Hatalı mesajlar geçmişe girmez; sunucuya yalnızca gerçek konuşma gider.
    const history = [...messages.filter((m) => !m.error), userMsg];
    setMessages((m) => [...m, userMsg]);
    setDraft("");
    chat.mutate(
      history.map((m) => ({ role: m.role, text: m.text })),
      {
        onSuccess: (res) => {
          setRemaining(res.remainingToday);
          setMessages((m) => [...m, { id: nid(), role: "model", text: res.reply, res }]);
        },
        onError: (e) => {
          const msg =
            e instanceof ApiError && e.message
              ? e.message
              : "Bir şeyler ters gitti. Biraz sonra tekrar dene.";
          setMessages((m) => [...m, { id: nid(), role: "model", text: msg, error: true }]);
        },
      },
    );
  };

  const empty = messages.length === 0;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(3,15,39,.54)" }]} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "padding"}>
          <Animated.View
            style={[
              {
                height: height * 0.88,
                backgroundColor: C.foam,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                overflow: "hidden",
                transform: [{ translateY: y }],
              },
              shadow(0.2, 24, -10),
            ]}
          >
            {/* Başlık */}
            <LinearGradient
              colors={G_PRIMARY}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingTop: 14, paddingBottom: 12, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,.22)", alignItems: "center", justifyContent: "center" }}>
                <Dolphin size={36} mood="joy" />
              </View>
              <View style={{ flex: 1 }}>
                <T f="h" style={{ color: "#fff", fontSize: 17 }}>Dolphy</T>
                <T f="bm" style={{ color: "rgba(255,255,255,.85)", fontSize: 12 }}>
                  Çalışma koçun{remaining !== null ? ` · bugün ${remaining} mesaj hakkın kaldı` : ""}
                </T>
              </View>
              <Press
                onPress={onClose}
                accessibilityLabel="Kapat"
                style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,.22)", alignItems: "center", justifyContent: "center" }}
              >
                <T f="hm" style={{ color: "#fff", fontSize: 16 }}>✕</T>
              </Press>
            </LinearGradient>

            {/* Sabit hazır mesajlar */}
            <View style={{ backgroundColor: C.pearl, borderBottomWidth: 1, borderBottomColor: C.mist }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 10, gap: 8 }}
              >
                {chips.map((c) => (
                  <Press
                    key={c}
                    disabled={busy}
                    onPress={() => send(c)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 18,
                      backgroundColor: C.foam,
                      borderWidth: 1.5,
                      borderColor: C.tide,
                      opacity: busy ? 0.5 : 1,
                    }}
                  >
                    <T f="bm" style={{ color: C.tide, fontSize: 13 }}>{c}</T>
                  </Press>
                ))}
              </ScrollView>
            </View>

            {/* Mesajlar */}
            <ScrollView
              ref={scroller}
              style={{ flex: 1 }}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: true })}
              contentContainerStyle={{ padding: 14, gap: 10 }}
            >
              {empty && (
                <View style={{ alignItems: "center", paddingVertical: 24, gap: 10 }}>
                  <Dolphin size={96} mood="wink" />
                  <T f="h" style={{ fontSize: 17 }}>Merhaba, ben Dolphy!</T>
                  <T f="b" style={{ color: C.muted, textAlign: "center", lineHeight: 20, paddingHorizontal: 18 }}>
                    Yanlışlarına bakıp sana özel çalışma planı çıkarabilir, eksik konularına benzer sorular hazırlayabilirim. Yukarıdan bir şey seç ya da yaz.
                  </T>
                </View>
              )}

              {messages.map((m) =>
                m.role === "user" ? (
                  <View key={m.id} style={{ alignSelf: "flex-end", maxWidth: "82%" }}>
                    <LinearGradient
                      colors={G_PRIMARY}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ borderRadius: 18, borderBottomRightRadius: 5, paddingHorizontal: 14, paddingVertical: 10 }}
                    >
                      <T f="bm" style={{ color: "#fff", fontSize: 14.5, lineHeight: 20 }}>{m.text}</T>
                    </LinearGradient>
                  </View>
                ) : (
                  <View key={m.id} style={{ flexDirection: "row", gap: 8, alignItems: "flex-end", maxWidth: "96%" }}>
                    <View style={{ width: 30, alignItems: "center" }}>
                      <Dolphin size={30} mood="smile" />
                    </View>
                    <View
                      style={[
                        {
                          flexShrink: 1,
                          backgroundColor: m.error ? "#FDECEA" : C.pearl,
                          borderRadius: 18,
                          borderBottomLeftRadius: 5,
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                        },
                        shadow(0.06, 8, 2),
                      ]}
                    >
                      {m.error ? (
                        <T f="bm" style={{ color: C.error, fontSize: 14, lineHeight: 20 }}>{m.text}</T>
                      ) : (
                        <AiMessageBody text={m.text} res={m.res} busy={busy} onAsk={send} />
                      )}
                    </View>
                  </View>
                ),
              )}

              {busy && (
                <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-end" }}>
                  <View style={{ width: 30, alignItems: "center" }}>
                    <Dolphin size={30} mood="smile" />
                  </View>
                  <View style={{ backgroundColor: C.pearl, borderRadius: 18, borderBottomLeftRadius: 5, paddingHorizontal: 14, paddingVertical: 6 }}>
                    <Typing />
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Yazma alanı */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-end",
                gap: 8,
                paddingHorizontal: 12,
                paddingTop: 8,
                paddingBottom: insets.bottom + 10,
                backgroundColor: C.pearl,
                borderTopWidth: 1,
                borderTopColor: C.mist,
              }}
            >
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Dolphy'ye yaz…"
                placeholderTextColor="#8A9AB3"
                maxLength={MAX_CHARS}
                multiline
                editable={!busy}
                onSubmitEditing={() => send(draft)}
                style={{
                  flex: 1,
                  maxHeight: 100,
                  minHeight: 44,
                  borderRadius: 22,
                  backgroundColor: C.foam,
                  borderWidth: 1.5,
                  borderColor: C.mist,
                  paddingHorizontal: 16,
                  paddingTop: 11,
                  paddingBottom: 11,
                  fontSize: 14.5,
                  color: C.ink,
                }}
              />
              <Press
                disabled={busy || !draft.trim()}
                onPress={() => send(draft)}
                accessibilityLabel="Gönder"
                style={{ opacity: busy || !draft.trim() ? 0.45 : 1 }}
              >
                <LinearGradient
                  colors={G_PRIMARY}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" }}
                >
                  <T f="h" style={{ color: "#fff", fontSize: 18 }}>➤</T>
                </LinearGradient>
              </Press>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
