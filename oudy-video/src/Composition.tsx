import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
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
const OVERLAP = 14;

type SceneProps = {
  zoomFrom: number;
  zoomTo: number;
  origin: string;
  duration: number;
  eyebrow: string;
  title: string;
  titleLatin?: boolean;
  sub?: string;
  children?: React.ReactNode;
};

const Reveal: React.FC<{ delay: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  delay,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200 }, durationInFrames: 28 });
  return (
    <div
      style={{
        opacity: p,
        translate: `0px ${interpolate(p, [0, 1], [60, 0])}px`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const Scene: React.FC<SceneProps> = ({
  zoomFrom,
  zoomTo,
  origin,
  duration,
  eyebrow,
  title,
  titleLatin,
  sub,
  children,
}) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, OVERLAP], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const zoom = interpolate(frame, [0, duration + OVERLAP], [zoomFrom, zoomTo], {
    easing: Easing.bezier(0.32, 0.72, 0, 1),
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: fadeIn, backgroundColor: BG }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img
          src={staticFile("oudy.jpg")}
          style={{
            position: "absolute",
            height: H,
            width: (H * 1290) / 1286,
            left: -((H * 1290) / 1286 - W) / 2,
            top: 0,
            transformOrigin: origin,
            scale: zoom,
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to top, rgba(21,15,10,0.92) 0%, rgba(21,15,10,0.55) 32%, rgba(21,15,10,0) 58%)",
        }}
      />
      <AbsoluteFill
        style={{
          padding: "100px 80px",
          direction: "rtl",
          justifyContent: "space-between",
        }}
      >
        <Reveal delay={4}>
          <div
            style={{
              alignSelf: "flex-start",
              display: "inline-block",
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
            }}
          >
            {eyebrow}
          </div>
        </Reveal>
        <div>
          <Reveal delay={10}>
            <div
              style={{
                fontFamily: titleLatin ? cormorant.fontFamily : markazi.fontFamily,
                fontSize: titleLatin ? 220 : 170,
                lineHeight: 1,
                color: CREAM,
                letterSpacing: titleLatin ? 24 : 0,
                direction: titleLatin ? "ltr" : "rtl",
                textAlign: titleLatin ? "left" : "right",
              }}
            >
              {title}
            </div>
          </Reveal>
          {sub ? (
            <Reveal delay={18}>
              <div
                style={{
                  marginTop: 28,
                  fontFamily: markazi.fontFamily,
                  fontSize: 64,
                  lineHeight: 1.3,
                  color: GOLD,
                  textAlign: "right",
                }}
              >
                {sub}
              </div>
            </Reveal>
          ) : null}
          {children}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - 26, fps, config: { damping: 200 }, durationInFrames: 30 });
  const pulse = interpolate(Math.sin(frame / 7), [-1, 1], [1, 1.035]);
  return (
    <div
      style={{
        marginTop: 56,
        alignSelf: "flex-end",
        display: "flex",
        justifyContent: "flex-end",
        opacity: p,
        translate: `0px ${interpolate(p, [0, 1], [50, 0])}px`,
      }}
    >
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
        }}
      >
        اطلبه الآن
      </div>
    </div>
  );
};

const SCENES = [
  { from: 0, dur: 90 },
  { from: 90, dur: 90 },
  { from: 180, dur: 90 },
  { from: 270, dur: 90 },
];

export const MyComposition: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <Sequence from={SCENES[0].from} durationInFrames={SCENES[0].dur + OVERLAP}>
        <Scene
          zoomFrom={1}
          zoomTo={1.14}
          origin="50% 58%"
          duration={SCENES[0].dur}
          eyebrow="Dr. Scent"
          title="عود بلون الذهب"
        />
      </Sequence>
      <Sequence from={SCENES[1].from} durationInFrames={SCENES[1].dur + OVERLAP}>
        <Scene
          zoomFrom={1.9}
          zoomTo={2.35}
          origin="26% 78%"
          duration={SCENES[1].dur}
          eyebrow="Oud"
          title="العود الخام"
          sub="خشب وراتنج بدفء العنبر"
        />
      </Sequence>
      <Sequence from={SCENES[2].from} durationInFrames={SCENES[2].dur + OVERLAP}>
        <Scene
          zoomFrom={1.7}
          zoomTo={1.45}
          origin="52% 60%"
          duration={SCENES[2].dur}
          eyebrow="Breeze of Joy"
          title="OUDY"
          titleLatin
          sub="زجاجة سوداء بغطاء فضي"
        />
      </Sequence>
      <Sequence from={SCENES[3].from} durationInFrames={SCENES[3].dur}>
        <Scene
          zoomFrom={1.2}
          zoomTo={1}
          origin="50% 58%"
          duration={SCENES[3].dur}
          eyebrow="Dr. Scent"
          title="Oudy"
          titleLatin
        >
          <Cta />
        </Scene>
      </Sequence>
    </AbsoluteFill>
  );
};
