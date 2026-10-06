import React from 'react';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

/** Original, bundled vector artwork. No external images or network requests. */
export function ArtworkImage({
  assetKey,
  size = 240,
}: {
  assetKey: string;
  size?: number;
}) {
  const tide = assetKey === 'tide';
  const orbit = assetKey === 'orbit';
  const premium = assetKey === 'premium';
  const base = tide
    ? '#063B51'
    : orbit
    ? '#271D50'
    : premium
    ? '#39222F'
    : '#5031A0';
  const light = tide
    ? '#9BFFF0'
    : orbit
    ? '#E0BAFF'
    : premium
    ? '#FFE2A8'
    : '#F7ADFF';
  return (
    <Svg
      width="100%"
      height={size}
      viewBox="0 0 400 400"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Defs>
        <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={base} />
          <Stop offset="1" stopColor="#111A2C" />
        </LinearGradient>
        <RadialGradient id="orb" cx="35%" cy="25%" r="80%">
          <Stop offset="0" stopColor="#FFFCE8" />
          <Stop offset="0.3" stopColor={light} />
          <Stop offset="0.75" stopColor={base} />
          <Stop offset="1" stopColor="#14121E" />
        </RadialGradient>
        <LinearGradient id="wave" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={light} />
          <Stop offset="1" stopColor={base} />
        </LinearGradient>
      </Defs>
      <Rect width="400" height="400" fill="url(#bg)" />
      {[40, 100, 160, 220, 280, 340].map(x => (
        <Path
          key={x}
          d={`M ${x} 0 V 400 M 0 ${x} H 400`}
          stroke="#FFFFFF"
          strokeOpacity={0.055}
        />
      ))}
      <Circle cx="325" cy="62" r="3" fill={light} />
      <Circle cx="65" cy="98" r="2" fill={light} />
      <Ellipse
        cx="200"
        cy="335"
        rx="110"
        ry="19"
        fill="#050717"
        opacity={0.45}
      />
      {tide ? (
        <G>
          <Circle cx="277" cy="114" r="46" fill="url(#orb)" />
          {[0, 1, 2, 3, 4].map(i => (
            <Path
              key={i}
              d={`M -20 ${180 + i * 37} Q 85 ${70 + i * 45} 190 ${
                185 + i * 31
              } T 430 ${160 + i * 42} V 420 H -20 Z`}
              fill="url(#wave)"
              stroke="#B6FFED"
              strokeOpacity={0.45}
              strokeWidth="2"
            />
          ))}
        </G>
      ) : premium ? (
        <G transform="translate(200 205)">
          <Path d="M 0 -140 L 110 0 L 0 136 L -110 0 Z" fill="url(#wave)" />
          <Path d="M 0 -140 L 0 136 L -110 0 Z" fill="#FFF1C9" opacity={0.45} />
          <Path d="M -110 0 L 110 0 L 0 136 Z" fill="#9D5F8A" opacity={0.5} />
          <Path
            d="M 0 -140 L 50 0 L 0 136 L -50 0 Z"
            fill="none"
            stroke="#FFF7D9"
            strokeWidth="2"
          />
        </G>
      ) : (
        <G>
          <Ellipse
            cx="200"
            cy="205"
            rx="163"
            ry="57"
            rotation="-32"
            origin="200, 205"
            fill="none"
            stroke={light}
            strokeWidth={orbit ? 18 : 4}
            opacity={0.45}
          />
          <Circle cx="200" cy="192" r={orbit ? 88 : 105} fill="url(#orb)" />
          <Path
            d="M 57 266 C 90 312 340 179 345 120"
            fill="none"
            stroke={light}
            strokeWidth={orbit ? 18 : 5}
          />
          {!orbit && (
            <>
              <Circle cx="305" cy="293" r="24" fill="url(#orb)" />
              <Ellipse
                cx="200"
                cy="192"
                rx="50"
                ry="105"
                rotation="28"
                origin="200,192"
                fill="none"
                stroke="#FFF0FF"
                strokeOpacity={0.35}
                strokeWidth="2"
              />
            </>
          )}
        </G>
      )}
      <Path
        d="M 24 45 V 24 H 45 M 355 376 H 376 V 355"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity={0.5}
        strokeWidth="2"
      />
    </Svg>
  );
}
