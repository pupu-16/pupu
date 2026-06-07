"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { HeartPulse, Mic, Send } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Web Speech API types (not in standard TS DOM lib)                   */
/* ------------------------------------------------------------------ */
interface ISpeechRecognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const g = (typeof window !== "undefined" ? window : {}) as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

const SpeechRecognitionCtor: SpeechRecognitionConstructor | null =
  g.SpeechRecognition || g.webkitSpeechRecognition || null;

const speechSupported = SpeechRecognitionCtor !== null;

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
interface ChatInputProps {
  message: string;
  onMessageChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function ChatInput({ message, onMessageChange, onSubmit }: ChatInputProps) {
  const [listening, setListening] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---- gentle hint (auto-dismiss) ---- */
  const showHint = useCallback((text: string) => {
    setHint(text);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => setHint(null), 3200);
  }, []);

  useEffect(() => {
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, []);

  /* ---- speech recognition ---- */
  const startListening = useCallback(() => {
    if (!SpeechRecognitionCtor) {
      showHint("Your browser doesn't support voice yet. Typing is just as good.");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "zh-CN";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const transcript = finalTranscript || interimTranscript;
      if (transcript) {
        onMessageChange(transcript);
      }

      /* auto-send when final result arrives */
      if (finalTranscript && formRef.current) {
        /* brief delay so user sees the text before it sends */
        setTimeout(() => {
          formRef.current?.requestSubmit();
        }, 280);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setListening(false);

      switch (event.error) {
        case "not-allowed":
          showHint("Microphone access was denied. You can still type softly.");
          break;
        case "no-speech":
          showHint("I didn't catch anything. Try again, or just type.");
          break;
        case "audio-capture":
          showHint("I couldn't reach the microphone. Typing works just as well.");
          break;
        default:
          showHint("Something went wrong with voice. The keyboard still works.");
      }
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [onMessageChange, showHint]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setListening(false);
  }, []);

  /* ---- cleanup on unmount ---- */
  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, []);

  /* ---- render ---- */
  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="glass-panel relative flex w-full max-w-3xl items-center gap-3 rounded-[24px] p-2"
    >
      {/* heart icon */}
      <div className="ml-3 hidden h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-[#f2c391] sm:grid">
        <HeartPulse className="h-4 w-4" />
      </div>

      {/* input */}
      <input
        value={listening ? message || "..." : message}
        onChange={(event) => onMessageChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent px-2 text-[15px] text-white/88 outline-none placeholder:text-white/34"
        placeholder={
          listening
            ? "Listening..."
            : "Say something softly..."
        }
        aria-label="Chat input"
      />

      {/* mic button — only shown when speech is supported */}
      {speechSupported && (
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={listening ? stopListening : startListening}
            className={[
              "grid h-10 w-10 place-items-center rounded-[16px] border transition duration-300",
              listening
                ? "border-[#8ff8dd]/50 bg-[#8ff8dd]/16 text-[#bfffee] shadow-[0_0_24px_rgba(143,248,221,0.28)]"
                : "border-white/[0.08] bg-white/[0.03] text-white/44 hover:border-[#8ff8dd]/22 hover:text-[#8ff8dd]/80"
            ].join(" ")}
            aria-label={listening ? "Stop listening" : "Start voice input"}
          >
            {listening ? (
              <span className="relative">
                <Mic className="h-4 w-4" />
                {/* pulse ring while listening */}
                <span className="absolute inset-[-4px] animate-pulse rounded-full border border-[#8ff8dd]/25" />
              </span>
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </button>

          {/* gentle hint tooltip */}
          {hint && (
            <span className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-[12px] border border-white/[0.08] bg-black/80 px-3 py-1.5 text-[11px] text-white/54 backdrop-blur-md">
              {hint}
            </span>
          )}
        </div>
      )}

      {/* send button */}
      <button
        type="submit"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-[18px] bg-[#eec28f] text-[#160f0c] shadow-[0_0_30px_rgba(238,194,143,0.3)] transition hover:scale-[1.03] hover:bg-[#f5d3a6] focus:outline-none focus:ring-2 focus:ring-[#f5d3a6]/70"
        aria-label="Send message"
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}
