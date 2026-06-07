"use client";

import { motion } from "framer-motion";
import { EmotionCategory } from "@/app/lib/chat-engine";
import { TimeOfDay, timeOfDayConfigs } from "@/app/lib/types";

/* ------------------------------------------------------------------ */
/*  Static particle data (positions, colors — never change)            */
/* ------------------------------------------------------------------ */
const particles = Array.from({ length: 58 }, (_, index) => {
  const angle = index * 137.5;
  const radius = 28 + ((index * 19) % 132);
  const x = 50 + Math.cos((angle * Math.PI) / 180) * (radius / 2.35);
  const y = 50 + Math.sin((angle * Math.PI) / 180) * (radius / 2.85);
  const colors = [
    "rgba(129, 244, 218, 0.95)",
    "rgba(248, 198, 147, 0.86)",
    "rgba(184, 211, 255, 0.82)",
    "rgba(226, 169, 210, 0.76)",
    "rgba(199, 238, 176, 0.82)"
  ];

  return {
    id: index,
    x: `${x}%`,
    y: `${y}%`,
    size: `${2 + (index % 5)}px`,
    color: colors[index % colors.length],
    opacity: 0.32 + (index % 7) * 0.085,
    delay: (index % 11) * 0.16,
    driftX: ((index % 9) - 4) * 5,
    driftY: ((index % 7) - 3) * 4
  };
});

/* ------------------------------------------------------------------ */
/*  Emotion → visual config                                           */
/* ------------------------------------------------------------------ */
interface EmotionConfig {
  coreShadow: string;
  particleSpeedMul: number;
  particleBrightnessMul: number;
  breathingDuration: number;
  coreMaxBlur: number;
  emotionOverlay: string;
  driftMul?: number; // defaults to 1.0; >1 = wider particle spread
}

const emotionConfigs: Record<EmotionCategory, EmotionConfig> = {
  tired: {
    coreShadow:
      "0 0 58px rgba(100,170,215,0.32), 0 0 130px rgba(120,150,195,0.10)",
    particleSpeedMul: 0.55,
    particleBrightnessMul: 0.68,
    breathingDuration: 6.2,
    coreMaxBlur: 1.4,
    emotionOverlay:
      "radial-gradient(ellipse at center, rgba(65,105,155,0.08), transparent 64%)"
  },
  happy: {
    coreShadow:
      "0 0 100px rgba(175,225,135,0.48), 0 0 165px rgba(238,195,125,0.24)",
    particleSpeedMul: 1.18,
    particleBrightnessMul: 1.22,
    breathingDuration: 3.9,
    coreMaxBlur: 0.35,
    emotionOverlay:
      "radial-gradient(ellipse at center, rgba(195,175,105,0.06), transparent 64%)"
  },
  anxious: {
    coreShadow:
      "0 0 68px rgba(135,175,205,0.32), 0 0 125px rgba(155,165,195,0.12)",
    particleSpeedMul: 0.82,
    particleBrightnessMul: 0.85,
    breathingDuration: 4.0,
    coreMaxBlur: 0.65,
    emotionOverlay:
      "radial-gradient(ellipse at center, rgba(115,135,175,0.05), transparent 64%)"
  },
  lost: {
    coreShadow:
      "0 0 100px rgba(125,155,205,0.28), 0 0 195px rgba(145,135,185,0.10)",
    particleSpeedMul: 0.72,
    particleBrightnessMul: 0.75,
    breathingDuration: 5.8,
    coreMaxBlur: 1.1,
    emotionOverlay:
      "radial-gradient(ellipse at center, rgba(125,115,175,0.07), transparent 68%)"
  },
  bored: {
    coreShadow:
      "0 0 68px rgba(125,175,185,0.28), 0 0 125px rgba(155,165,165,0.10)",
    particleSpeedMul: 0.90,
    particleBrightnessMul: 0.88,
    breathingDuration: 5.0,
    coreMaxBlur: 0.7,
    emotionOverlay:
      "radial-gradient(ellipse at center, rgba(135,145,155,0.04), transparent 64%)"
  },
  late_night: {
    coreShadow:
      "0 0 48px rgba(95,115,195,0.28), 0 0 105px rgba(115,95,175,0.12)",
    particleSpeedMul: 0.62,
    particleBrightnessMul: 0.60,
    breathingDuration: 6.8,
    coreMaxBlur: 1.2,
    emotionOverlay:
      "radial-gradient(ellipse at center, rgba(38,28,85,0.10), transparent 64%)"
  },
  graduation: {
    coreShadow:
      "0 0 90px rgba(165,185,135,0.36), 0 0 150px rgba(215,165,115,0.18)",
    particleSpeedMul: 1.05,
    particleBrightnessMul: 1.05,
    breathingDuration: 4.5,
    coreMaxBlur: 0.7,
    emotionOverlay:
      "radial-gradient(ellipse at center, rgba(175,155,105,0.05), transparent 64%)"
  },
  philosophical: {
    coreShadow:
      "0 0 52px rgba(95,115,185,0.30), 0 0 115px rgba(105,95,165,0.12)",
    particleSpeedMul: 0.68,
    particleBrightnessMul: 0.72,
    breathingDuration: 6.0,
    coreMaxBlur: 0.9,
    emotionOverlay:
      "radial-gradient(ellipse at center, rgba(55,45,115,0.08), transparent 64%)"
  },
  casual: {
    coreShadow:
      "0 0 84px rgba(114,238,216,0.42), 0 0 180px rgba(237,183,139,0.18)",
    particleSpeedMul: 1.0,
    particleBrightnessMul: 1.0,
    breathingDuration: 4.8,
    coreMaxBlur: 0.8,
    emotionOverlay: "transparent"
  }
};

/* ------------------------------------------------------------------ */
/*  Radio → particle weather configs                                   */
/* ------------------------------------------------------------------ */
const radioConfigs: Record<string, EmotionConfig> = {
  "rain-room": {
    coreShadow:
      "0 0 72px rgba(110,190,200,0.36), 0 0 140px rgba(130,170,185,0.14)",
    particleSpeedMul: 0.72,
    particleBrightnessMul: 0.78,
    breathingDuration: 5.6,
    coreMaxBlur: 1.0,
    emotionOverlay:
      "radial-gradient(ellipse at center, rgba(80,150,170,0.08), transparent 64%)",
    driftMul: 0.85
  },
  "midnight-lofi": {
    coreShadow:
      "0 0 78px rgba(180,160,120,0.38), 0 0 140px rgba(200,150,100,0.16)",
    particleSpeedMul: 0.92,
    particleBrightnessMul: 0.72,
    breathingDuration: 5.0,
    coreMaxBlur: 0.7,
    emotionOverlay:
      "radial-gradient(ellipse at center, rgba(160,120,80,0.06), transparent 62%)",
    driftMul: 0.72
  },
  "soft-piano": {
    coreShadow:
      "0 0 90px rgba(150,195,185,0.34), 0 0 160px rgba(170,180,160,0.12)",
    particleSpeedMul: 0.78,
    particleBrightnessMul: 0.82,
    breathingDuration: 6.2,
    coreMaxBlur: 0.9,
    emotionOverlay:
      "radial-gradient(ellipse at center, rgba(140,170,155,0.05), transparent 66%)",
    driftMul: 1.15
  },
  "ambient-space": {
    coreShadow:
      "0 0 100px rgba(100,130,190,0.28), 0 0 200px rgba(110,100,170,0.10)",
    particleSpeedMul: 0.48,
    particleBrightnessMul: 0.62,
    breathingDuration: 7.8,
    coreMaxBlur: 1.5,
    emotionOverlay:
      "radial-gradient(ellipse at center, rgba(50,40,120,0.08), transparent 68%)",
    driftMul: 1.45
  },
  "morning-light": {
    coreShadow:
      "0 0 95px rgba(180,210,150,0.40), 0 0 155px rgba(220,190,130,0.18)",
    particleSpeedMul: 1.12,
    particleBrightnessMul: 1.15,
    breathingDuration: 4.2,
    coreMaxBlur: 0.5,
    emotionOverlay:
      "radial-gradient(ellipse at center, rgba(190,180,120,0.05), transparent 62%)",
    driftMul: 1.05
  }
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
interface ParticleLifeformProps {
  characterImage?: string | null;
  emotion?: EmotionCategory | null;
  timeOfDay?: TimeOfDay;
  musicChannel?: string | null;
  isMusicPlaying?: boolean;
}

export default function ParticleLifeform({
  characterImage,
  emotion,
  timeOfDay = "day",
  musicChannel,
  isMusicPlaying = false
}: ParticleLifeformProps) {
  /* config priority: active emotion > playing radio > time-of-day */
  const hasActiveEmotion = emotion && emotion !== "casual";
  const hasActiveRadio =
    isMusicPlaying && !!musicChannel && !!radioConfigs[musicChannel];

  const config = hasActiveEmotion
    ? emotionConfigs[emotion]
    : hasActiveRadio
      ? radioConfigs[musicChannel!]
      : timeOfDayConfigs[timeOfDay];

  const driftMul = config.driftMul ?? 1.0;

  return (
    <div className="relative flex w-full flex-1 items-center justify-center">
      {/* outer ring */}
      <motion.div
        aria-hidden="true"
        className="absolute h-[520px] w-[520px] max-w-[78vw] rounded-full border border-white/[0.04]"
        animate={{
          scale: [1, 1.035, 1],
          opacity: [0.26, 0.42, 0.26],
          rotate: [0, 8, 0]
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <motion.div
        className="relative grid aspect-square w-[min(62vw,470px)] place-items-center"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* inner ring */}
        <motion.div
          className="absolute inset-[14%] rounded-full border border-[#8ff8dd]/15"
          animate={{
            scale: [0.96, 1.06, 0.96],
            opacity: [0.12, 0.34, 0.12]
          }}
          transition={{
            duration: 5.8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* ---- lifeform core (shadow & blur now dynamic) ---- */}
        <motion.div
          className="lifeform-core absolute h-[42%] w-[42%] rounded-full"
          style={{ boxShadow: config.coreShadow }}
          animate={{
            scale: [1, 1.08, 1],
            filter: [
              "blur(0px)",
              `blur(${config.coreMaxBlur}px)`,
              "blur(0px)"
            ]
          }}
          transition={{
            duration: config.breathingDuration,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* ---- character image blend (breathing synced to core) ---- */}
        {characterImage && (
          <div className="absolute inset-0 z-[3] flex items-center justify-center">
            <motion.div
              className="relative flex items-center justify-center"
              style={{ width: "34%", height: "34%" }}
              animate={{ scale: [1, 1.08, 1] }}
              transition={{
                duration: config.breathingDuration,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div
                className="absolute inset-0 overflow-hidden"
                style={{
                  maskImage:
                    "radial-gradient(ellipse 42% 42% at 50% 50%, black 26%, transparent 62%)",
                  WebkitMaskImage:
                    "radial-gradient(ellipse 42% 42% at 50% 50%, black 26%, transparent 62%)"
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={characterImage}
                  alt=""
                  className="h-full w-full object-cover"
                  style={{
                    mixBlendMode: "screen",
                    opacity: 0.46,
                    filter: "brightness(1.1) saturate(0.84)"
                  }}
                />
              </div>
              <div
                className="absolute inset-[-22%] pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at center, rgba(143,248,221,0.26) 0%, rgba(237,183,139,0.12) 38%, transparent 64%)"
                }}
              />
            </motion.div>
          </div>
        )}

        {/* ---- emotion color overlay ---- */}
        {config.emotionOverlay !== "transparent" && (
          <div
            aria-hidden="true"
            className="absolute inset-0 z-[4] pointer-events-none transition-all duration-[2000ms]"
            style={{ background: config.emotionOverlay }}
          />
        )}

        {/* ---- radial gradient veil ---- */}
        <motion.div
          className="absolute h-[58%] w-[58%] rounded-full bg-[radial-gradient(circle,rgba(143,248,221,0.16),transparent_62%)]"
          animate={{
            scale: [0.92, 1.12, 0.92],
            opacity: [0.42, 0.72, 0.42]
          }}
          transition={{ duration: 6.4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* ---- particles (speed & brightness driven by emotion) ---- */}
        <div className="absolute inset-0">
          {particles.map((particle) => (
            <motion.span
              key={particle.id}
              className="particle"
              style={
                {
                  "--x": particle.x,
                  "--y": particle.y,
                  "--size": particle.size,
                  "--color": particle.color,
                  "--opacity":
                    particle.opacity * config.particleBrightnessMul
                } as React.CSSProperties
              }
              animate={{
                x: [
                  0,
                  particle.driftX * driftMul,
                  -particle.driftX * 0.45 * driftMul,
                  0
                ],
                y: [
                  0,
                  particle.driftY * driftMul,
                  -particle.driftY * 0.55 * driftMul,
                  0
                ],
                scale: [0.85, 1.25, 0.9],
                opacity: [
                  particle.opacity * 0.58 * config.particleBrightnessMul,
                  particle.opacity * config.particleBrightnessMul,
                  particle.opacity * 0.7 * config.particleBrightnessMul
                ]
              }}
              transition={{
                duration:
                  (5.2 + (particle.id % 6) * 0.75) / config.particleSpeedMul,
                repeat: Infinity,
                ease: "easeInOut",
                delay: particle.delay
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
