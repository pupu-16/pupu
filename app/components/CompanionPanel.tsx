"use client";

import { motion } from "framer-motion";
import { Leaf, MemoryStick, Music2, Upload } from "lucide-react";
import { CharacterState, MockAction, MusicChannel } from "@/app/lib/types";

interface CompanionPanelProps {
  activeAction: MockAction | null;
  onAction: (action: MockAction) => void;
  character: CharacterState | null;
  memoryCount: number;
  currentChannel: MusicChannel | null;
  isPlaying: boolean;
}

const actionItems = [
  {
    id: "upload" as const,
    label: "Upload Character",
    detail: "waiting for a future face",
    icon: Upload
  },
  {
    id: "music" as const,
    label: "Background Music",
    detail: "silent mock ambience",
    icon: Music2
  },
  {
    id: "memory" as const,
    label: "Save Memory",
    detail: "nothing stored yet",
    icon: MemoryStick
  }
];

export default function CompanionPanel({
  activeAction,
  onAction,
  character,
  memoryCount,
  currentChannel,
  isPlaying
}: CompanionPanelProps) {
  return (
    <aside className="glass-panel flex flex-col justify-between gap-5 rounded-[26px] p-4 lg:my-12 lg:min-h-[520px]">
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs uppercase tracking-[0.28em] text-white/42">Companion</span>
          <Leaf className="h-4 w-4 text-[#c7eeb0]/70" />
        </div>

        {actionItems.map((item) => {
          const Icon = item.icon;
          const active = activeAction === item.id;
          const isUpload = item.id === "upload";
          const isMemory = item.id === "memory";
          const isMusic = item.id === "music";
          const hasCharacter = isUpload && character;
          const hasMemories = isMemory && memoryCount > 0;
          const musicActive = isMusic && isPlaying && currentChannel;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onAction(item.id)}
              className="group flex w-full items-center gap-3 rounded-[20px] border border-white/[0.08] bg-white/[0.045] p-3 text-left transition duration-300 hover:border-[#8ff8dd]/28 hover:bg-white/[0.075] focus:outline-none focus:ring-2 focus:ring-[#8ff8dd]/40"
            >
              {/* icon slot */}
              <span
                className={[
                  "grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-[16px] border transition",
                  active
                    ? "border-[#8ff8dd]/42 bg-[#8ff8dd]/18 text-[#bfffee] shadow-[0_0_28px_rgba(143,248,221,0.22)]"
                    : "border-white/10 bg-black/18 text-white/66 group-hover:text-[#bfffee]"
                ].join(" ")}
              >
                {hasCharacter ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={character!.imageUrl}
                    alt={character!.name || "Character"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </span>

              {/* label row */}
              <span className="min-w-0">
                <span className="flex items-center gap-2 truncate text-sm font-medium text-white/86">
                  {hasCharacter
                    ? character!.name || "Unnamed Companion"
                    : musicActive
                      ? currentChannel!.name
                      : item.label}
                  {hasMemories && (
                    <span className="shrink-0 rounded-full border border-[#c7eeb0]/25 bg-[#c7eeb0]/[0.08] px-1.5 py-0.5 text-[10px] font-normal text-[#c7eeb0]/70">
                      {memoryCount}
                    </span>
                  )}
                </span>
                <span className="mt-1 block truncate text-xs text-white/38">
                  {hasCharacter
                    ? "tap to change"
                    : musicActive
                      ? "playing · tap to change"
                      : hasMemories
                        ? `${memoryCount} seed${memoryCount > 1 ? "s" : ""} in the garden`
                        : item.detail}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-[22px] border border-white/[0.07] bg-black/20 p-4">
        <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-white/38">
          <span className="h-1.5 w-1.5 rounded-full bg-[#f2c391]" />
          Mood Signal
        </div>
        <div className="space-y-2">
          {["breathing", "near", "unhurried"].map((signal, index) => (
            <div key={signal} className="flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#8ff8dd] via-[#b8d3ff] to-[#f2c391]"
                  initial={{ width: "20%" }}
                  animate={{ width: `${58 + index * 13}%` }}
                  transition={{ duration: 1.2, delay: index * 0.08 }}
                />
              </div>
              <span className="w-20 text-right text-xs text-white/44">{signal}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
