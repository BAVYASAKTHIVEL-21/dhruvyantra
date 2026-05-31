"use client";

import { motion } from "framer-motion";
import { CalendarClock } from "lucide-react";
import { HolographicCard } from "./holographic-card";

export function RevisionReminder() {
  return (
    <HolographicCard
      glow="warm"
      float={false}
      className="absolute bottom-[38%] left-[4%] z-30 w-[150px] p-3"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.65, duration: 0.6 }}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F59E0B]/15">
          <CalendarClock className="h-4 w-4 text-[#F59E0B]" />
        </div>
        <div>
          <p className="text-[9px] text-[#94A3B8]">Revision due</p>
          <p className="text-[11px] font-semibold text-[#F8FAFC]">2 topics today</p>
        </div>
      </div>
      <motion.div
        className="mt-2 h-1 overflow-hidden rounded-full bg-white/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] to-[#8B5CF6]"
          initial={{ width: 0 }}
          animate={{ width: "65%" }}
          transition={{ delay: 1, duration: 1.2, ease: "easeOut" }}
        />
      </motion.div>
    </HolographicCard>
  );
}
