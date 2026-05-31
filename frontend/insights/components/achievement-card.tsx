"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

export function AchievementCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.24 }}
      className="insights-achievement relative flex h-full min-h-[200px] flex-col justify-between overflow-hidden rounded-2xl border border-[#8B5CF6]/25 p-6"
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-[#8B5CF6]/30 blur-3xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="font-heading text-lg font-bold leading-snug text-[#F8FAFC] md:text-xl">
            You&apos;re in the top 18%
            <br />
            of all DhruvYantra users!
          </p>
          <p className="mt-3 text-sm text-[#C4B5FD]">Keep pushing, champion! 🚀</p>
        </div>
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8B5CF6]/40 to-[#EC4899]/30 ring-1 ring-[#8B5CF6]/40 shadow-[0_0_32px_rgba(139,92,246,0.4)]">
          <Trophy className="h-8 w-8 text-[#FDE68A]" />
        </div>
      </div>
      <div className="relative mt-4 inline-flex w-fit rounded-full bg-[#8B5CF6]/20 px-3 py-1 text-xs font-semibold text-[#E9D5FF] ring-1 ring-[#8B5CF6]/35">
        Top Performer
      </div>
    </motion.div>
  );
}
