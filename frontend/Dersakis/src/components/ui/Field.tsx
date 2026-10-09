import React from "react";
import { TextInput, TextInputProps, View } from "react-native";
import { C, FONT } from "@/theme";
import { T } from "./T";

export function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  maxLength,
  error,
  inputProps,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  /** Alan altında kırmızı hata metni; kenarlık da kırmızı olur */
  error?: string;
  /** keyboardType, secureTextEntry, autoCapitalize vb. */
  inputProps?: TextInputProps;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? (
        <T f="bb" style={{ fontSize: 12, color: C.muted, marginBottom: 7 }}>
          {label}
        </T>
      ) : null}
      <TextInput
        {...inputProps}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9AA9BD"
        maxLength={maxLength}
        multiline={multiline}
        style={{
          fontFamily: FONT.b,
          fontSize: 14,
          color: C.ink,
          backgroundColor: "#fff",
          borderWidth: 1.5,
          borderColor: error ? C.error : C.mist,
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingTop: multiline ? 12 : 0,
          paddingBottom: multiline ? 12 : 0,
          height: multiline ? undefined : 48,
          minHeight: multiline ? 78 : undefined,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
      {error ? (
        <T f="bs" style={{ fontSize: 11, color: C.error, marginTop: 5 }}>
          {error}
        </T>
      ) : null}
    </View>
  );
}