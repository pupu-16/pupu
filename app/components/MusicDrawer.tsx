"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CloudRain, Globe, Moon, Music, Pause, Play, Sun, X } from "lucide-react";
import { MUSIC_CHANNELS, MusicChannel } from "@/app/lib/types";

/* ------------------------------------------------------------------ */
/*  Channel → icon mapping                                            */
/* ------------------------------------------------------------------ */
const channelIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "rain-room": CloudRain,
  "midnight-lofi": Moon,
  "soft-piano": Music,
  "ambient-space": Globe,
  "morning-light": Sun
};

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
interface MusicDrawerProps {
  open: boolean;
  currentChannel: MusicChannel | null;
  isPlaying: boolean;
  onClose: () => void;
  onSelect: (channel: MusicChannel) => void;
  onTogglePlay: () => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function MusicDrawer({
  open,
  currentChannel,
  isPlaying,
  onClose,
  onSelect,
  onTogglePlay
}: MusicDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4">
          {/* backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/52 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* panel */}
          <motion.div
            className="glass-panel relative z-10 flex w-full max-w-md flex-col gap-4 rounded-[28px] p-6"
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 18 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            {/* header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full border border-white/[0.08] bg-white/[0.04] text-white/54">
                  <Music className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm font-medium text-white/78">
                  Atmosphere Radio
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-full border border-white/[0.08] text-white/44 transition hover:border-white/18 hover:text-white/78"
                aria-label="Close music panel"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* now playing indicator */}
            {currentChannel && (
              <div className="flex items-center gap-3 rounded-[20px] border border-[#8ff8dd]/14 bg-[#8ff8dd]/[0.05] px-4 py-3">
                <motion.span
                  className="h-2 w-2 shrink-0 rounded-full bg-[#8ff8dd]"
                  animate={
                    isPlaying
                      ? { opacity: [1, 0.35, 1], scale: [1, 0.85, 1] }
                      : { opacity: 0.35, scale: 1 }
                  }
                  transition={
                    isPlaying
                      ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                      : {}
                  }
                />
                <span className="flex-1 truncate text-[13px] text-white/74">
                  {currentChannel.name}
                </span>
                <button
                  type="button"
                  onClick={onTogglePlay}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/[0.10] text-white/62 transition hover:border-[#8ff8dd]/28 hover:text-[#8ff8dd]"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="h-3.5 w-3.5" />
                  ) : (
                    <Play className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            )}

            {/* channel list */}
            <div className="flex flex-col gap-2">
              <p className="px-1 text-[11px] uppercase tracking-[0.22em] text-white/30">
                Channels
              </p>
              {MUSIC_CHANNELS.map((channel) => {
                const Icon = channelIcons[channel.id] ?? Music;
                const isActive = currentChannel?.id === channel.id;

                return (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => onSelect(channel)}
                    className={[
                      "group flex items-center gap-3 rounded-[18px] border p-3 text-left transition duration-300",
                      isActive
                        ? "border-[#8ff8dd]/22 bg-[#8ff8dd]/[0.07]"
                        : "border-white/[0.06] bg-white/[0.025] hover:border-[#8ff8dd]/16 hover:bg-white/[0.05]"
                    ].join(" ")}
                  >
                    {/* icon */}
                    <span
                      className={[
                        "grid h-10 w-10 shrink-0 place-items-center rounded-[14px] border transition",
                        isActive
                          ? "border-[#8ff8dd]/32 bg-[#8ff8dd]/12 text-[#bfffee]"
                          : "border-white/8 bg-black/16 text-white/48 group-hover:text-white/70"
                      ].join(" ")}
                    >
                      <Icon className="h-4 w-4" />
                    </span>

                    {/* text */}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-white/82">
                        {channel.name}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-white/36">
                        {channel.description}
                      </span>
                      <span className="mt-1.5 flex flex-wrap gap-1">
                        {channel.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-white/[0.06] bg-white/[0.03] px-1.5 py-0.5 text-[9px] text-white/30"
                          >
                            {tag}
                          </span>
                        ))}
                      </span>
                    </span>

                    {/* play indicator */}
                    {isActive && isPlaying && (
                      <motion.span
                        className="flex shrink-0 gap-[2px]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            className="block w-[2px] rounded-full bg-[#8ff8dd]/70"
                            animate={{
                              height: [6, 14, 6],
                            }}
                            transition={{
                              duration: 0.7 + i * 0.15,
                              repeat: Infinity,
                              ease: "easeInOut",
                              delay: i * 0.12,
                            }}
                          />
                        ))}
                      </motion.span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* footer hint */}
            <p className="text-center text-[10px] text-white/20">
              Add mp3 files to /public/audio/ to hear these tones. Silence works too.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
