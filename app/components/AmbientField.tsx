"use client";

import { motion } from "framer-motion";

export default function AmbientField() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute left-[-12%] top-[18%] h-[1px] w-[124%] bg-gradient-to-r from-transparent via-[#8ff8dd]/18 to-transparent"
        animate={{ y: [0, 22, 0], opacity: [0.12, 0.28, 0.12] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[24%] left-[-18%] h-[1px] w-[136%] bg-gradient-to-r from-transparent via-[#f2c391]/16 to-transparent"
        animate={{ y: [0, -18, 0], opacity: [0.08, 0.24, 0.08] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-x-[8%] top-[8%] h-[68%] rounded-full border border-white/[0.035]" />
      <div className="absolute inset-x-[18%] bottom-[9%] h-[28%] rounded-full border border-[#f2c391]/[0.045]" />
    </div>
  );
}
