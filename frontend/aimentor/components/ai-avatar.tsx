"use client";

import { motion } from "framer-motion";

export function AiAvatar({ size = "md" }: { size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const eye = size === "sm" ? "h-1 w-1" : "h-1.5 w-1.5";

  return (
    <motion.div
      className={`relative shrink-0 ${dim}`}
      animate={{ scale: [1, 1.03, 1] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="mentor-orb-glow absolute inset-0 rounded-full" />
      <div className="relative flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#1e1b4b] to-[#0B1020] ring-2 ring-[#8B5CF6]/40">
        <div className="flex gap-1.5 pt-0.5">
          <span className={`rounded-full bg-[#F8FAFC] ${eye}`} />
          <span className={`rounded-full bg-[#F8FAFC] ${eye}`} />
        </div>
      </div>
    </motion.div>
  );
}
