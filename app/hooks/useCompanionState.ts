"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { detectEmotion, EmotionCategory, getReply, getWhisper } from "@/app/lib/chat-engine";
import { actionCopy, CHARACTER_WHISPERS, CharacterState, ChatAPIRequest, ChatAPIResponse, ChatMessage, LifeformState, MEMORY_MAX_CARDS, MEMORY_STORAGE_KEY, MemoryCard, MockAction, MusicChannel, musicWhispers, PersistentMemoryStore, PRESENCE_MESSAGES, TimeOfDay, timeOfDayWhispers } from "@/app/lib/types";

let messageCounter = 0;
let memoryCounter = 0;
function nextMsgId(): string {
  messageCounter += 1;
  return `msg_${messageCounter}_${Math.random().toString(36).slice(2, 8)}`;
}
function nextMemId(): string {
  memoryCounter += 1;
  return `mem_${memoryCounter}_${Math.random().toString(36).slice(2, 8)}`;
}

/* ---- tiny helpers ---- */
function summarize(text: string, maxLen = 54): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + "…";
}

function detectTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "day";
  if (hour >= 18 && hour < 24) return "evening";
  return "deep-night";
}

export function useCompanionState() {
  const [activeAction, setActiveAction] = useState<MockAction | null>(null);
  const [message, setMessage] = useState("");
  const [whisper, setWhisper] = useState(
    () => timeOfDayWhispers[detectTimeOfDay()].initial
  );
  const [character, setCharacter] = useState<CharacterState | null>(null);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionCategory | null>(null);
  /* ---- persistent memory (localStorage) ---- */
  function loadMemories(): MemoryCard[] {
    try {
      const raw = localStorage.getItem(MEMORY_STORAGE_KEY);
      if (!raw) return [];
      const store: PersistentMemoryStore = JSON.parse(raw);
      if (store?.version === 1 && Array.isArray(store.cards)) {
        return store.cards.slice(0, MEMORY_MAX_CARDS);
      }
      return [];
    } catch {
      return [];
    }
  }

  function saveMemories(cards: MemoryCard[]) {
    try {
      const trimmed = cards.slice(0, MEMORY_MAX_CARDS);
      const store: PersistentMemoryStore = {
        version: 1,
        savedAt: Date.now(),
        cards: trimmed
      };
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(store));
    } catch {
      /* quota exceeded or storage unavailable — silently skip */
    }
  }

  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>(loadMemories);

  /* sync memoryCards → localStorage on change */
  useEffect(() => {
    saveMemories(memoryCards);
  }, [memoryCards]);
  const [memoryDrawerOpen, setMemoryDrawerOpen] = useState(false);
  const [musicDrawerOpen, setMusicDrawerOpen] = useState(false);
  const [currentChannel, setCurrentChannel] = useState<MusicChannel | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeOfDay] = useState<TimeOfDay>(detectTimeOfDay);
  const [rememberingActive, setRememberingActive] = useState(false);
  const [respondingActive, setRespondingActive] = useState(false);

  /* derived particle state */
  const lifeformState: LifeformState = useMemo(() => {
    if (rememberingActive) return "remembering";
    if (respondingActive) return "responding";
    if (isTyping) return "thinking";
    if (message.length > 0) return "listening";
    return "idle";
  }, [rememberingActive, respondingActive, isTyping, message]);

  /* ---- refs ---- */
  const characterUrlRef = useRef<string | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastExchangeRef = useRef<{
    userText: string;
    companionText: string;
    emotion: EmotionCategory;
  } | null>(null);
  const lastActivityRef = useRef(Date.now());
  const idleStageRef = useRef(0);
  const presenceCountRef = useRef(0);
  const lastPresenceTimeRef = useRef(0);
  const characterNameRef = useRef(character?.name ?? null);
  characterNameRef.current = character?.name ?? null;

  /* ---- revoke helper ---- */
  const revokeCharacterUrl = useCallback(() => {
    if (characterUrlRef.current) {
      URL.revokeObjectURL(characterUrlRef.current);
      characterUrlRef.current = null;
    }
  }, []);

  /* ---- unmount cleanup ---- */
  useEffect(() => {
    return () => {
      revokeCharacterUrl();
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, [revokeCharacterUrl]);

  /* ---- idle whisper rotation ---- */
  function markActivity() {
    lastActivityRef.current = Date.now();
    idleStageRef.current = 0;
  }

  useEffect(() => {
    const idleTimer = setInterval(() => {
      const idle = Date.now() - lastActivityRef.current;
      const stage = idleStageRef.current;

      /* 5-min presence: send a single gentle chat message (max 2 per session) */
      if (idle > 300_000 && presenceCountRef.current < 2) {
        const since = Date.now() - lastPresenceTimeRef.current;
        if (since > 300_000) {
          presenceCountRef.current += 1;
          lastPresenceTimeRef.current = Date.now();
          const msg =
            PRESENCE_MESSAGES[
              Math.floor(Math.random() * PRESENCE_MESSAGES.length)
            ];
          setMessages((prev) => [
            ...prev,
            {
              id: nextMsgId(),
              role: "companion",
              text: msg,
              timestamp: Date.now()
            }
          ]);
        }
      }

      if (idle > 120_000 && stage < 3) {
        idleStageRef.current = 3;
        setCurrentEmotion(null);
        /* after 120s, stop changing — particles breathe deep on their own */
      } else if (idle > 60_000 && stage < 2) {
        idleStageRef.current = 2;
        setWhisper(timeOfDayWhispers[timeOfDay].idle60s);
      } else if (idle > 30_000 && stage < 1) {
        idleStageRef.current = 1;
        /* character-aware variant (30% chance if character exists) */
        const cName = characterNameRef.current;
        if (cName && Math.random() < 0.3) {
          const cw = CHARACTER_WHISPERS[
            Math.floor(Math.random() * CHARACTER_WHISPERS.length)
          ];
          setWhisper(cw.replace("{name}", cName));
        } else {
          setWhisper(timeOfDayWhispers[timeOfDay].idle30s);
        }
      }
    }, 5_000);

    return () => clearInterval(idleTimer);
  }, [timeOfDay]);

  /* ---- actions ---- */
  function handleAction(action: MockAction) {
    markActivity();
    setActiveAction(action);
    if (action === "upload") {
      setWhisper("Choose a face for this space.");
      setShowUploadPanel(true);
    } else if (action === "memory") {
      saveMemory();
    } else if (action === "music") {
      setActiveAction("music");
      setMusicDrawerOpen(true);
      setWhisper(
        isPlaying && currentChannel
          ? musicWhispers[currentChannel.id] ?? "The tone is still here."
          : "Choose an atmosphere. I'll keep it gentle."
      );
    } else {
      setWhisper(actionCopy[action]);
    }
  }

  /* ---- LLM reply helper ---- */
  async function fetchLLMReply(
    userText: string,
    emotion: EmotionCategory
  ): Promise<string | null> {
    try {
      /* build history: last 6 exchanges (12 messages) */
      const recent = messages.slice(-12);
      const history = recent.map((m) => ({
        role: (m.role === "companion" ? "assistant" : "user") as
          | "user"
          | "assistant",
        content: m.text
      }));

      /* build context */
      const recentMemories = memoryCards.slice(0, 3).map(
        (c) => `[${c.emotion}] ${c.userSummary} → ${c.companionSummary}`
      );

      const body: ChatAPIRequest = {
        message: userText,
        history,
        context: {
          timeOfDay,
          characterName: character?.name ?? null,
          radioChannel: isPlaying ? currentChannel?.id ?? null : null,
          recentMemories,
          emotion
        }
      };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!res.ok) return null;

      const data: ChatAPIResponse = await res.json();
      return data.reply ?? null;
    } catch {
      return null;
    }
  }

  /* ---- chat engine: LLM first, Mock fallback ---- */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    markActivity();
    const trimmed = message.trim();

    if (!trimmed) {
      setWhisper("You can arrive without saying anything.");
      return;
    }

    const userMsg: ChatMessage = {
      id: nextMsgId(),
      role: "user",
      text: trimmed,
      timestamp: Date.now()
    };
    setMessages((prev) => [...prev, userMsg]);
    setMessage("");
    setIsTyping(true);

    /* detect emotion for visual feedback (always runs) */
    const category = detectEmotion(trimmed);
    setCurrentEmotion(category);

    /* try LLM; fallback to Mock */
    fetchLLMReply(trimmed, category).then((llmReply) => {
      const isMock = llmReply === null;
      const reply = isMock ? getReply(category) : llmReply;
      const newWhisper = isMock
        ? getWhisper(category)
        : "光轻轻闪了一下。我在听。";

      const companionMsg: ChatMessage = {
        id: nextMsgId(),
        role: "companion",
        text: reply,
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, companionMsg]);
      setWhisper(newWhisper);
      setIsTyping(false);
      typingTimerRef.current = null;

      /* trigger responding state (~2s) */
      setRespondingActive(true);
      setTimeout(() => setRespondingActive(false), 2200);

      /* store exchange for memory saving */
      lastExchangeRef.current = {
        userText: trimmed,
        companionText: reply,
        emotion: category
      };
    });
  }

  /* ---- memory card ---- */
  function saveMemory() {
    const exchange = lastExchangeRef.current;

    if (!exchange) {
      if (memoryCards.length > 0) {
        setMemoryDrawerOpen(true);
        setWhisper("The garden is still here. Nothing new, but you can look back.");
      } else {
        setWhisper("There isn't a conversation to hold yet. Say something first.");
      }
      return;
    }

    const card: MemoryCard = {
      id: nextMemId(),
      timestamp: Date.now(),
      userSummary: summarize(exchange.userText),
      companionSummary: summarize(exchange.companionText),
      emotion: exchange.emotion,
      characterName: character?.name ?? null
    };

    setMemoryCards((prev) => [card, ...prev]);
    setMemoryDrawerOpen(true);
    setActiveAction("memory");

    /* trigger remembering pulse (~2s) */
    setRememberingActive(true);
    setTimeout(() => setRememberingActive(false), 2200);

    /* character-aware whisper (40% chance if character exists) */
    if (character?.name && Math.random() < 0.4) {
      const cw = CHARACTER_WHISPERS[
        Math.floor(Math.random() * CHARACTER_WHISPERS.length)
      ];
      setWhisper(cw.replace("{name}", character.name));
    } else {
      setWhisper("A seed fell into the garden. I'll hold it gently.");
    }
  }

  function deleteMemory(id: string) {
    setMemoryCards((prev) => prev.filter((card) => card.id !== id));
  }

  function openMemoryDrawer() {
    setMemoryDrawerOpen(true);
  }

  function closeMemoryDrawer() {
    setMemoryDrawerOpen(false);
    setActiveAction(null);
  }

  /* ---- music / atmosphere radio ---- */
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioErrorRef = useRef(false);

  /* create audio element once */
  function getAudio(): HTMLAudioElement {
    if (!audioRef.current) {
      const a = new Audio();
      a.loop = true;
      a.volume = 0.35;
      audioRef.current = a;
    }
    return audioRef.current;
  }

  function openMusicDrawer() {
    setMusicDrawerOpen(true);
  }

  function closeMusicDrawer() {
    setMusicDrawerOpen(false);
    setActiveAction(null);
  }

  function selectChannel(channel: MusicChannel) {
    audioErrorRef.current = false;
    setCurrentChannel(channel);

    const audio = getAudio();
    /* stop current playback */
    audio.pause();

    audio.src = channel.audioSrc;

    audio.onerror = () => {
      audioErrorRef.current = true;
      setIsPlaying(false);
      setWhisper("This tone isn't available yet. The silence is still good.");
    };

    audio.onloadeddata = () => {
      audioErrorRef.current = false;
    };

    audio.play().then(() => {
      setIsPlaying(true);
      setWhisper(
        musicWhispers[channel.id] ?? "The tone shifted. Can you feel it?"
      );
    }).catch(() => {
      /* autoplay blocked — user needs to click play */
      setIsPlaying(false);
      setWhisper(
        "Press play when you're ready. The tone is waiting."
      );
    });
  }

  function togglePlayPause() {
    const audio = audioRef.current;
    if (!audio || !currentChannel || audio.error) {
      /* no audio available — keep mock state */
      setIsPlaying((prev) => {
        const next = !prev;
        setWhisper(
          next
            ? "Mock atmosphere — no audio file found."
            : "The tone rests. Silence is also a kind of music."
        );
        return next;
      });
      return;
    }

    if (audio.paused) {
      audio.play().then(() => {
        setIsPlaying(true);
        setWhisper(
          musicWhispers[currentChannel.id] ?? "Resuming the quiet."
        );
      }).catch(() => {
        setWhisper("Press play when you're ready.");
      });
    } else {
      audio.pause();
      setIsPlaying(false);
      setWhisper("The tone rests. Silence is also a kind of music.");
    }
  }

  function stopMusic() {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setCurrentChannel(null);
    setIsPlaying(false);
    setWhisper("The tone rests. Silence is also a kind of music.");
  }

  /* ---- upload panel ---- */
  function cancelUpload() {
    setShowUploadPanel(false);
    setActiveAction(null);
  }

  function confirmCharacter(file: File, name: string) {
    revokeCharacterUrl();
    const url = URL.createObjectURL(file);
    characterUrlRef.current = url;
    setCharacter({ imageUrl: url, name });
    setShowUploadPanel(false);
    setWhisper(
      name
        ? `I'll remember this face as ${name}.`
        : "This face feels right. I'll hold it gently."
    );
  }

  function restoreDefault() {
    revokeCharacterUrl();
    setCharacter(null);
    setShowUploadPanel(false);
    setActiveAction(null);
    setWhisper("Back to the quiet light. Just breathing.");
  }

  return {
    activeAction,
    message,
    setMessage,
    whisper,
    character,
    showUploadPanel,
    messages,
    isTyping,
    currentEmotion,
    memoryCards,
    memoryDrawerOpen,
    musicDrawerOpen,
    currentChannel,
    isPlaying,
    timeOfDay,
    lifeformState,
    handleAction,
    handleSubmit,
    saveMemory,
    deleteMemory,
    openMemoryDrawer,
    closeMemoryDrawer,
    openMusicDrawer,
    closeMusicDrawer,
    selectChannel,
    togglePlayPause,
    stopMusic,
    cancelUpload,
    confirmCharacter,
    restoreDefault
  };
}
