import React from "react";
import { StyleSheet } from "react-native";
import Svg, { Defs, Path, Pattern, Rect } from "react-native-svg";

export const GridBg = React.memo(function GridBg() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <Pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <Path
            d="M24 0H0V24"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
            fill="none"
          />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#grid)" />
    </Svg>
  );
});