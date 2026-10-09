import React from "react";
import { View } from "react-native";
import { C } from "@/theme";
import { Press } from "./Press";
import { T } from "./T";

export function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 24,
        marginBottom: 13,
      }}
    >
      <T f="h" style={{ fontSize: 19 }}>
        {title}
      </T>
      {action ? (
        <Press onPress={onAction} style={{ padding: 8 }}>
          <T f="bb" style={{ color: C.tide, fontSize: 12 }}>
            {action}
          </T>
        </Press>
      ) : null}
    </View>
  );
}