"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Flower2, Sparkles, Trash2, X } from "lucide-react";
import { EmotionCategory } from "@/app/lib/chat-engine";
import { MemoryCard } from "@/app/lib/types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function formatTime(ts: number): string {
  const date = new Date(ts);
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const emotionLabels: Record<EmotionCategory, string> = {
  tired: "tired",
  happy: "happy",
  anxious: "anxious",
  lost: "lost",
  bored: "bored",
  late_night: "late night",
  graduation: "graduation",
  philosophical: "thinking",
  casual: "casual"
};

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
interface MemoryDrawerProps {
  open: boolean;
  cards: MemoryCard[];
  onClose: () => void;
  onDelete: (id: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function MemoryDrawer({
  open,
  cards,
  onClose,
  onDelete
}: MemoryDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-40 flex justify-end">
          {/* backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/48 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* drawer */}
          <motion.aside
            className="glass-panel relative z-10 flex h-full w-full max-w-[420px] flex-col overflow-hidden rounded-l-[28px]"
            initial={{ x: 48, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 48, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            {/* header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <div className="flex items-center gap-2.5">
                <Flower2 className="h-4 w-4 text-[#c7eeb0]/70" />
                <span className="text-sm font-medium text-white/78">
                  Memory Garden
                </span>
                {cards.length > 0 && (
                  <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/44">
                    {cards.length}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-full border border-white/[0.08] text-white/48 transition hover:border-white/18 hover:text-white/78"
                aria-label="Close memory drawer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* content */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {cards.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                  <span className="grid h-16 w-16 place-items-center rounded-[22px] border border-white/[0.06] bg-white/[0.03]">
                    <Flower2 className="h-6 w-6 text-white/18" />
                  </span>
                  <p className="text-sm text-white/36">
                    No memories yet.
                  </p>
                  <p className="text-xs text-white/22">
                    A conversation saved is a seed planted. Talk a little, then press Save Memory.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <AnimatePresence>
                    {cards.map((card) => (
                      <motion.div
                        key={card.id}
                        initial={{ opacity: 0, scale: 0.94, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, x: 24 }}
                        transition={{ duration: 0.26, ease: "easeOut" }}
                        className="group relative overflow-hidden rounded-[20px] border border-white/[0.08] bg-white/[0.035] p-4 transition hover:border-[#8ff8dd]/16"
                      >
                        {/* subtle glow on hover */}
                        <div className="pointer-events-none absolute inset-0 rounded-[20px] bg-[radial-gradient(ellipse_at_60%_20%,rgba(143,248,221,0.06),transparent_55%)] opacity-0 transition duration-500 group-hover:opacity-100" />

                        {/* top row: time + emotion + delete */}
                        <div className="relative flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-white/34">
                              {formatTime(card.timestamp)}
                            </span>
                            <span className="rounded-full border border-white/[0.07] bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-white/40">
                              {emotionLabels[card.emotion]}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onDelete(card.id)}
                            className="grid h-7 w-7 place-items-center rounded-full text-white/28 opacity-0 transition hover:bg-white/[0.06] hover:text-[#f2c391]/70 group-hover:opacity-100"
                            aria-label="Delete memory"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>

                        {/* character name */}
                        {card.characterName && (
                          <p className="relative mt-2 text-[11px] text-[#c7eeb0]/56">
                            with {card.characterName}
                          </p>
                        )}

                        {/* content */}
                        <div className="relative mt-2 space-y-2">
                          <div className="flex items-start gap-1.5">
                            <span className="mt-[2px] shrink-0 text-[10px] text-white/24">
                              you
                            </span>
                            <p className="text-[13px] leading-relaxed text-white/56">
                              {card.userSummary}
                            </p>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <Sparkles className="mt-[2px] h-3 w-3 shrink-0 text-[#8ff8dd]/40" />
                            <p className="text-[13px] leading-relaxed text-white/52">
                              {card.companionSummary}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* footer hint */}
            {cards.length > 0 && (
              <div className="shrink-0 border-t border-white/[0.05] px-5 py-3 text-center text-[11px] text-white/22">
                These seeds stay in this browser for now.
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
