import React from "react";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";

export type DolphinMood = "smile" | "joy" | "wink";

/**
 * Dolphy: Dolphora maskotu. Sağa bakan, tatlı, çizgi film tarzı yunus.
 * Tamamen vektör (SVG); native bağımlılık yok. `flip` ile sola baktırılır.
 */
export function Dolphin({
  size = 120,
  mood = "smile",
  flip = false,
}: {
  size?: number;
  mood?: DolphinMood;
  flip?: boolean;
}) {
  const w = size;
  const h = size * (170 / 220);
  return (
    <Svg
      width={w}
      height={h}
      viewBox="0 0 220 170"
      style={flip ? { transform: [{ scaleX: -1 }] } : undefined}
    >
      <Defs>
        <LinearGradient id="dpBody" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2E7BFF" />
          <Stop offset="0.55" stopColor="#4CB4FF" />
          <Stop offset="1" stopColor="#7ADCF2" />
        </LinearGradient>
        <LinearGradient id="dpFin" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#1B63E8" />
          <Stop offset="1" stopColor="#3D9BFF" />
        </LinearGradient>
      </Defs>

      {/* kuyruk yüzgeçleri */}
      <Path
        d="M36 108 C20 98 10 84 6 68 C22 68 36 78 46 94 Z"
        fill="url(#dpFin)"
      />
      <Path
        d="M34 120 C18 126 8 138 6 152 C24 152 38 142 48 128 Z"
        fill="url(#dpFin)"
      />

      {/* sırt yüzgeci */}
      <Path
        d="M98 44 C104 24 120 14 138 10 C130 24 132 36 138 44 Z"
        fill="url(#dpFin)"
      />

      {/* gövde */}
      <Path
        d="M207 92 C207 84 199 80 191 76 C183 52 161 36 130 36 C90 36 52 62 34 104 C30 112 28 118 28 123 C62 152 118 160 158 139 C177 129 191 111 201 103 C206 100 207 96 207 92 Z"
        fill="url(#dpBody)"
      />
      {/* karın */}
      <Path
        d="M48 130 C96 154 152 146 183 118 C191 111 200 105 204 102 C206 100 206 96 206 95 C196 104 176 108 154 110 C128 114 100 108 76 114 C62 118 52 124 48 130 Z"
        fill="#EAF8FF"
      />
      {/* parlama */}
      <Path
        d="M96 50 C112 44 128 44 142 50"
        stroke="#fff"
        strokeOpacity={0.55}
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
      />

      {/* yan yüzgeç */}
      <Path
        d="M120 112 C108 126 104 142 98 152 C118 146 132 132 138 116 Z"
        fill="url(#dpFin)"
      />

      {/* yanak */}
      <Ellipse cx="158" cy="92" rx="10" ry="6.5" fill="#FF9DB0" opacity={0.9} />

      {/* göz */}
      {mood === "wink" ? (
        <Path
          d="M154 72 Q164 62 175 72"
          stroke="#0A2A66"
          strokeWidth={4}
          strokeLinecap="round"
          fill="none"
        />
      ) : (
        <G>
          <Circle cx="165" cy="72" r="15" fill="#fff" />
          <Circle cx="167.5" cy="73.5" r="10.5" fill="#0A2A66" />
          <Circle cx="172" cy="68" r="4.2" fill="#fff" />
          <Circle cx="163" cy="77" r="1.8" fill="#fff" />
        </G>
      )}
      {/* kaş */}
      {mood !== "wink" && (
        <Path
          d="M154 55 Q164 49 174 54"
          stroke="#0A2A66"
          strokeWidth={2.6}
          strokeLinecap="round"
          fill="none"
        />
      )}

      {/* ağız */}
      {mood === "joy" ? (
        <G>
          <Path
            d="M205 94 C196 118 172 116 164 98 C178 104 194 102 205 94 Z"
            fill="#0A2A66"
          />
          <Path
            d="M174 108 C180 102 192 104 196 108 C190 116 180 116 174 108 Z"
            fill="#FF7A8A"
          />
        </G>
      ) : (
        <Path
          d="M204 93 Q190 108 168 96"
          stroke="#0A2A66"
          strokeWidth={3.4}
          strokeLinecap="round"
          fill="none"
        />
      )}

      {/* ışıltılar */}
      <Path
        d="M196 30 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 Z"
        fill="#FFD66B"
      />
      <Circle cx="24" cy="40" r="3" fill="#BDE6FF" />
    </Svg>
  );
}
