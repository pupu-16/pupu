"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface WhisperBubbleProps {
  whisper: string;
}

export default function WhisperBubble({ whisper }: WhisperBubbleProps) {
  return (
    <motion.div
      className="glass-panel mb-2 flex max-w-[min(560px,92vw)] items-center gap-3 rounded-full px-4 py-3 text-sm text-white/74"
      animate={{ y: [0, -3, 0], opacity: [0.78, 1, 0.78] }}
      transition={{ duration: 5.6, repeat: Infinity, ease: "easeInOut" }}
    >
      <Sparkles className="h-4 w-4 shrink-0 text-[#8ff8dd]" />
      <AnimatePresence mode="wait">
        <motion.span
          key={whisper}
          initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
          transition={{ duration: 0.32 }}
          className="truncate"
        >
          {whisper}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}
