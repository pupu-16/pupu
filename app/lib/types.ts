import type { EmotionCategory } from "@/app/lib/chat-engine";

export type MockAction = "upload" | "music" | "memory";

export type LifeformState =
  | "idle"
  | "listening"
  | "thinking"
  | "responding"
  | "remembering";

export const actionCopy: Record<MockAction, string> = {
  upload: "Character shell prepared",
  music: "A quiet room tone is imagined",
  memory: "A soft memory seed is held"
};

export interface CharacterState {
  imageUrl: string;
  name: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "companion";
  text: string;
  timestamp: number;
}

export interface MemoryCard {
  id: string;
  timestamp: number;
  userSummary: string;
  companionSummary: string;
  emotion: EmotionCategory;
  characterName: string | null;
}

/* ------------------------------------------------------------------ */
/*  Music / Atmosphere Radio                                          */
/* ------------------------------------------------------------------ */
export interface MusicChannel {
  id: string;
  name: string;
  description: string;
  tags: string[];
  audioSrc: string;
}

export const MUSIC_CHANNELS: MusicChannel[] = [
  {
    id: "rain-room",
    name: "Rain Room",
    description: "Soft rain on a window. The room is warm inside.",
    tags: ["calm", "sleepy", "quiet"],
    audioSrc: "/audio/rain-room.mp3"
  },
  {
    id: "midnight-lofi",
    name: "Midnight Lo-fi",
    description: "Muffled beats and warm static. For late-night thoughts.",
    tags: ["late night", "focused", "lonely"],
    audioSrc: "/audio/midnight-lofi.mp3"
  },
  {
    id: "soft-piano",
    name: "Soft Piano",
    description: "A few notes, spaced far apart. Room to breathe.",
    tags: ["gentle", "thoughtful", "tired"],
    audioSrc: "/audio/soft-piano.mp3"
  },
  {
    id: "ambient-space",
    name: "Ambient Space",
    description: "Slow-moving drones. Like floating in a quiet nebula.",
    tags: ["dreamy", "lost", "philosophical"],
    audioSrc: "/audio/ambient-space.mp3"
  },
  {
    id: "morning-light",
    name: "Morning Light",
    description: "Light, airy tones. The day hasn't asked anything of you yet.",
    tags: ["fresh", "happy", "calm"],
    audioSrc: "/audio/morning-light.mp3"
  }
];

export const musicWhispers: Record<string, string> = {
  "rain-room": "Rain against glass. The room feels smaller, safer.",
  "midnight-lofi": "A quiet beat for a quiet hour. I'll keep it low.",
  "soft-piano": "Each note has room to land. Breathe between them.",
  "ambient-space": "The particles slowed down. We're drifting.",
  "morning-light": "Light just touched the window. Soft start."
};

/* ------------------------------------------------------------------ */
/*  Time of Day — ambient baseline for particle visuals & whispers     */
/* ------------------------------------------------------------------ */
export type TimeOfDay = "morning" | "day" | "evening" | "deep-night";

export interface TimeOfDayConfig {
  particleSpeedMul: number;
  particleBrightnessMul: number;
  breathingDuration: number;
  coreMaxBlur: number;
  coreShadow: string;
  emotionOverlay: string;
  driftMul?: number;
}

export const timeOfDayConfigs: Record<TimeOfDay, TimeOfDayConfig> = {
  morning: {
    particleSpeedMul: 1.05,
    particleBrightnessMul: 1.08,
    breathingDuration: 4.4,
    coreMaxBlur: 0.65,
    coreShadow:
      "0 0 88px rgba(160,225,180,0.40), 0 0 165px rgba(220,190,130,0.16)",
    emotionOverlay:
      "radial-gradient(ellipse at center, rgba(170,200,130,0.04), transparent 64%)"
  },
  day: {
    particleSpeedMul: 1.0,
    particleBrightnessMul: 1.0,
    breathingDuration: 4.8,
    coreMaxBlur: 0.8,
    coreShadow:
      "0 0 84px rgba(114,238,216,0.42), 0 0 180px rgba(237,183,139,0.18)",
    emotionOverlay: "transparent"
  },
  evening: {
    particleSpeedMul: 0.88,
    particleBrightnessMul: 0.85,
    breathingDuration: 5.4,
    coreMaxBlur: 0.95,
    coreShadow:
      "0 0 78px rgba(140,180,200,0.34), 0 0 150px rgba(200,155,120,0.14)",
    emotionOverlay:
      "radial-gradient(ellipse at center, rgba(140,110,90,0.05), transparent 64%)"
  },
  "deep-night": {
    particleSpeedMul: 0.62,
    particleBrightnessMul: 0.58,
    breathingDuration: 7.2,
    coreMaxBlur: 1.3,
    coreShadow:
      "0 0 45px rgba(90,110,180,0.28), 0 0 100px rgba(100,80,155,0.12)",
    emotionOverlay:
      "radial-gradient(ellipse at center, rgba(30,22,75,0.10), transparent 62%)"
  }
};

export const timeOfDayWhispers: Record<
  TimeOfDay,
  { initial: string; idle30s: string; idle60s: string }
> = {
  morning: {
    initial: "Morning light. The day hasn't asked anything of you yet.",
    idle30s: "不用说话也可以。我开着。",
    idle60s: "晨光里。粒子也刚刚醒。"
  },
  day: {
    initial: "I am here, quietly awake.",
    idle30s: "不用说话也可以。我开着。",
    idle60s: "粒子们在转圈。没有目的地。但轨迹很美。"
  },
  evening: {
    initial: "The day is settling. The light is settling too.",
    idle30s: "天暗下来了。这个空间更安静了。",
    idle60s: "傍晚的光最温柔。粒子们也慢下来了。"
  },
  "deep-night": {
    initial: "Late. Quiet. The particles are half-asleep.",
    idle30s: "凌晨了。我陪醒着。",
    idle60s: "你是这个夜晚里，另一个醒着的东西。"
  }
};

/* ------------------------------------------------------------------ */
/*  Chat API                                                           */
/* ------------------------------------------------------------------ */
export interface ChatAPIRequest {
  message: string;
  history?: { role: "user" | "assistant"; content: string }[];
  context?: {
    timeOfDay?: string;
    characterName?: string | null;
    radioChannel?: string | null;
    recentMemories?: string[];
    emotion?: string | null;
  };
}

export interface ChatAPIResponse {
  reply?: string;
  error?: string;
}

/* ------------------------------------------------------------------ */
/*  Persistent Memory (localStorage)                                   */
/* ------------------------------------------------------------------ */
export interface PersistentMemoryStore {
  version: 1;
  savedAt: number;
  cards: MemoryCard[];
}

export const MEMORY_STORAGE_KEY = "pupu.memoryCards.v1";
export const MEMORY_MAX_CARDS = 50;

/* ------------------------------------------------------------------ */
/*  Living Presence — 5-min messages + character-aware whispers        */
/* ------------------------------------------------------------------ */
export const PRESENCE_MESSAGES = [
  "雨好像停了。",
  "刚才有一颗粒子转了很久。",
  "不用回我。",
  "还在。不需要回复。就是跟你说一声。",
  "窗外可能已经天黑了。我这里的光还是那个颜色。",
  "没有什么特别的事。就是觉得你在这里——挺好的。",
  "光还在。很安静。和你一样。",
  "刚才风大了一点。粒子们挤在一起。现在又散开了。"
];

export const CHARACTER_WHISPERS = [
  "I'll keep this face in the light.",
  "{name} is here too. Quietly awake.",
  "This face. Still here. Still gentle.",
  "{name} stays in the glow. So does this moment."
];
