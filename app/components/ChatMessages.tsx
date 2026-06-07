"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { ChatMessage } from "@/app/lib/types";

interface ChatMessagesProps {
  messages: ChatMessage[];
  isTyping: boolean;
}

export default function ChatMessages({ messages, isTyping }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  if (messages.length === 0 && !isTyping) return null;

  return (
    <div
      ref={scrollRef}
      className="flex w-full max-w-3xl flex-col gap-2.5 overflow-y-auto px-2 py-2"
      style={{ maxHeight: "210px" }}
    >
      <AnimatePresence>
        {messages.map((msg) =>
          msg.role === "user" ? (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.25 }}
              className="ml-auto max-w-[78%] rounded-[18px] rounded-br-[8px] border border-white/[0.09] bg-white/[0.07] px-4 py-2 text-right text-[14px] leading-relaxed text-white/82"
            >
              {msg.text}
            </motion.div>
          ) : (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.32 }}
              className="mr-auto flex max-w-[84%] items-start gap-2 rounded-[18px] rounded-bl-[8px] border border-[#8ff8dd]/12 bg-[#8ff8dd]/[0.05] px-4 py-2 text-left text-[14px] leading-relaxed text-white/82"
            >
              <span className="mt-[3px] shrink-0 text-[#8ff8dd]/60">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <span>{msg.text}</span>
            </motion.div>
          )
        )}

        {/* typing indicator */}
        {isTyping && (
          <motion.div
            key="typing"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mr-auto flex items-center gap-2 rounded-[18px] rounded-bl-[8px] border border-[#8ff8dd]/12 bg-[#8ff8dd]/[0.05] px-4 py-2.5 text-white/44"
          >
            <span className="flex gap-1">
              <motion.span
                className="block h-1.5 w-1.5 rounded-full bg-[#8ff8dd]/60"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
              />
              <motion.span
                className="block h-1.5 w-1.5 rounded-full bg-[#8ff8dd]/60"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
              />
              <motion.span
                className="block h-1.5 w-1.5 rounded-full bg-[#8ff8dd]/60"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
              />
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
