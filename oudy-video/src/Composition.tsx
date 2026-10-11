import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { loadFont } from "@remotion/fonts";

const markazi = { fontFamily: "MarkaziLocal, serif" };
const cormorant = { fontFamily: "CormorantLocal, serif" };
loadFont({ family: "MarkaziLocal", url: staticFile("fonts/Markazi-ar.woff2"), weight: "600" });
loadFont({ family: "CormorantLocal", url: staticFile("fonts/Cormorant-latin.woff2"), weight: "500" });

const BG = "#150F0A";
const GOLD = "#D4A965";
const CREAM = "#F3E9D9";
const W = 1080;
const H = 1920;
const IMG_W = (H * 1290) / 1286;
const IMG_H = H;

// One continuous camera path through the scene: [frame, zoom, centerX, centerY] (normalized image coords)
const CAM: [number, number, number, number][] = [
  [0, 1.0, 0.5, 0.5],
  [105, 1.5, 0.5, 0.6],
  [195, 1.6, 0.33, 0.67],
  [285, 1.68, 0.52, 0.62],
  [360, 1.18, 0.5, 0.56],
];

const ease = Easing.bezier(0.45, 0, 0.35, 1);
const frames = CAM.map((k) => k[0]);
const cam = (frame: number) => ({
  z: interpolate(frame, frames, CAM.map((k) => k[1]), { easing: ease }),
  cx: interpolate(frame, frames, CAM.map((k) => k[2]), { easing: ease }),
  cy: interpolate(frame, frames, CAM.map((k) => k[3]), { easing: ease }),
});

const Photo: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <Img
    src={staticFile("oudy.jpg")}
    style={{ position: "absolute", inset: 0, width: IMG_W, height: IMG_H, ...style }}
  />
);

const World: React.FC = () => {
  const frame = useCurrentFrame();
  const { z, cx, cy } = cam(frame);
  // handheld micro-sway so the camera feels physical
  const swayX = Math.sin(frame / 23) * 5 + Math.sin(frame / 9) * 1.5;
  const swayY = Math.cos(frame / 29) * 4;
  const roll = Math.sin(frame / 41) * 0.25;
  const tx = (0.5 - cx) * IMG_W * z + swayX;
  const ty = (0.5 - cy) * IMG_H * z + swayY;

  // slow-evolving silk ripple
  const bfX = 0.0035 + 0.0007 * Math.sin(frame / 38);
  const bfY = 0.011 + 0.002 * Math.cos(frame / 47);

  const staticMask =
    "linear-gradient(to bottom, transparent 61%, #000 68%), " +
    "linear-gradient(to right, transparent 37%, #000 43%, #000 60%, transparent 66%)";

  return (
    <div
      style={{
        position: "absolute",
        left: (W - IMG_W) / 2,
        top: 0,
        width: IMG_W,
        height: IMG_H,
        transform: `translate(${tx}px, ${ty}px) scale(${z}) rotate(${roll}deg)`,
        transformOrigin: "50% 50%",
        filter: "contrast(1.07) saturate(1.06)",
      }}
    >
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id="silk" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={`${bfX} ${bfY}`} numOctaves={2} seed={7} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={26} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      {/* base: static full photo */}
      <Photo />
      {/* rippling cloth layer */}
      <Photo style={{ filter: "url(#silk)" }} />
      {/* product stays rock-steady on top, feathered into the rippling cloth */}
      <Photo
        style={{
          WebkitMaskImage: staticMask,
          maskImage: staticMask,
          WebkitMaskSize: "100% 100%, 100% 72%",
          maskSize: "100% 100%, 100% 72%",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
        }}
      />
    </div>
  );
};

const Dust: React.FC = () => {
  const frame = useCurrentFrame();
  const specks = useMemo(
    () =>
      new Array(46).fill(0).map((_, i) => ({
        x: random(`x${i}`) * W,
        y0: random(`y${i}`) * (H + 400),
        size: 3 + random(`s${i}`) * 7,
        speed: 0.5 + random(`v${i}`) * 1.4,
        drift: 20 + random(`d${i}`) * 50,
        phase: random(`p${i}`) * 6.28,
        blur: random(`b${i}`) * 3,
      })),
    [],
  );
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {specks.map((s, i) => {
        const y = ((s.y0 - frame * s.speed * 2.2) % (H + 200) + (H + 200)) % (H + 200) - 100;
        const x = s.x + Math.sin(frame / 40 + s.phase) * s.drift;
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(frame / 18 + s.phase));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: s.size,
              height: s.size,
              borderRadius: "50%",
              background: "#F6D9A0",
              opacity: tw * 0.75,
              filter: `blur(${s.blur}px)`,
              boxShadow: "0 0 14px 4px rgba(246,217,160,0.5)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// a soft diagonal sheen that sweeps across the frame
const Sheen: React.FC<{ start: number; dur: number }> = ({ start, dur }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [start, start + dur], [-0.4, 1.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  const o = interpolate(frame, [start, start + dur * 0.5, start + dur], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        opacity: o * 0.55,
        mixBlendMode: "screen",
        background: `linear-gradient(115deg, transparent ${p * 100 - 14}%, rgba(255,236,200,0.9) ${p * 100}%, transparent ${p * 100 + 14}%)`,
      }}
    />
  );
};

const Caption: React.FC<{
  from: number;
  to: number;
  eyebrow: string;
  title: string;
  latin?: boolean;
  sub?: string;
  children?: React.ReactNode;
  keep?: boolean;
}> = ({ from, to, eyebrow, title, latin, sub, children, keep }) => {
  const frame = useCurrentFrame();
  const inP = interpolate(frame, [from, from + 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.32, 0.72, 0, 1),
  });
  const outP = keep
    ? 1
    : interpolate(frame, [to - 14, to], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
  const o = Math.min(inP, outP);
  if (frame < from - 1 || (!keep && frame > to + 1)) return null;
  return (
    <AbsoluteFill style={{ padding: "100px 80px", direction: "rtl", justifyContent: "space-between", opacity: o }}>
      <div
        style={{
          alignSelf: "flex-start",
          padding: "14px 34px",
          borderRadius: 999,
          border: `2px solid ${GOLD}`,
          color: GOLD,
          fontFamily: cormorant.fontFamily,
          fontSize: 40,
          letterSpacing: 10,
          textTransform: "uppercase",
          background: "rgba(21,15,10,0.45)",
          direction: "ltr",
          translate: `0px ${interpolate(inP, [0, 1], [-30, 0])}px`,
        }}
      >
        {eyebrow}
      </div>
      <div style={{ translate: `0px ${interpolate(inP, [0, 1], [70, 0])}px`, filter: `blur(${(1 - o) * 10}px)` }}>
        <div
          style={{
            fontFamily: latin ? cormorant.fontFamily : markazi.fontFamily,
            fontSize: latin ? 220 : 170,
            lineHeight: 1,
            color: CREAM,
            letterSpacing: latin ? 24 : 0,
            direction: latin ? "ltr" : "rtl",
            textAlign: latin ? "left" : "right",
            textShadow: "0 6px 40px rgba(0,0,0,0.55)",
          }}
        >
          {title}
        </div>
        {sub ? (
          <div
            style={{
              marginTop: 28,
              fontFamily: markazi.fontFamily,
              fontSize: 64,
              lineHeight: 1.3,
              color: GOLD,
              textAlign: "right",
              textShadow: "0 4px 24px rgba(0,0,0,0.6)",
            }}
          >
            {sub}
          </div>
        ) : null}
        {children}
      </div>
    </AbsoluteFill>
  );
};

const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = interpolate(Math.sin(frame / 7), [-1, 1], [1, 1.035]);
  return (
    <div style={{ marginTop: 56, display: "flex", justifyContent: "flex-end" }}>
      <div
        style={{
          scale: pulse,
          padding: "30px 70px",
          borderRadius: 999,
          background: GOLD,
          color: BG,
          fontFamily: markazi.fontFamily,
          fontSize: 84,
          lineHeight: 1.1,
          boxShadow: "0 20px 60px rgba(212,169,101,0.45)",
        }}
      >
        اطلبه الآن
      </div>
    </div>
  );
};

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const jx = random(`gx${frame % 6}`) * 200;
  const jy = random(`gy${frame % 6}`) * 200;
  return (
    <AbsoluteFill
      style={{
        opacity: 0.09,
        mixBlendMode: "overlay",
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        backgroundPosition: `${jx}px ${jy}px`,
      }}
    />
  );
};

export const MyComposition: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: BG, overflow: "hidden" }}>
      <World />
      <Dust />
      <Sheen start={120} dur={60} />
      <Sheen start={290} dur={55} />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(21,15,10,0) 45%, rgba(21,15,10,0.65) 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to top, rgba(21,15,10,0.88) 0%, rgba(21,15,10,0.45) 28%, rgba(21,15,10,0) 52%)",
        }}
      />
      <Caption from={8} to={100} eyebrow="Dr. Scent" title="عود بلون الذهب" />
      <Caption from={108} to={192} eyebrow="Oud" title="العود الخام" sub="خشب وراتنج بدفء العنبر" />
      <Caption from={200} to={284} eyebrow="Breeze of Joy" title="OUDY" latin sub="زجاجة سوداء بغطاء فضي" />
      <Caption from={292} to={360} eyebrow="Dr. Scent" title="Oudy" latin keep>
        <Cta />
      </Caption>
      <Grain />
    </AbsoluteFill>
  );
};
