import React, { useEffect, useRef } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, shadow } from "@/theme";
import { Toast } from "./Toast";

export function Sheet({
  children,
  onClose,
  toast,
}: {
  children: React.ReactNode;
  onClose: () => void;
  toast: string;
}) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const y = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    Animated.spring(y, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
      speed: 16,
    }).start();
  }, [y]);

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(3,15,39,.54)" },
          ]}
          onPress={onClose}
        />
        <KeyboardAvoidingView behavior="padding">
          <Animated.View
            style={[
              {
                maxHeight: height * 0.86,
                backgroundColor: C.foam,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                transform: [{ translateY: y }],
              },
              shadow(0.2, 24, -10),
            ]}
          >
            <View
              style={{
                width: 42,
                height: 4,
                borderRadius: 4,
                backgroundColor: "#B7C7D9",
                alignSelf: "center",
                marginTop: 10,
                marginBottom: 6,
              }}
            />
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: 10,
                paddingBottom: insets.bottom + 24,
              }}
            >
              {children}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
        <Toast text={toast} bottom={insets.bottom + 40} />
      </View>
    </Modal>
  );
}