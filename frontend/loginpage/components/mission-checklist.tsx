"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle } from "lucide-react";
import { HolographicCard } from "./holographic-card";

const missions = [
  { label: "Revise Organic Chemistry", done: true },
  { label: "PYQ — Rotational Motion", done: true },
  { label: "Watch concept lecture", done: false },
];

export function MissionChecklist() {
  return (
    <HolographicCard
      glow="blue"
      float={false}
      className="absolute bottom-[18%] right-[6%] z-30 w-[168px] p-3"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, duration: 0.6 }}
    >
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#38BDF8]">
        Today&apos;s Mission
      </p>
      <ul className="space-y-1.5">
        {missions.map((m, i) => (
          <motion.li
            key={m.label}
            className="flex items-start gap-1.5"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 + i * 0.1 }}
          >
            {m.done ? (
              <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-[#38BDF8]" />
            ) : (
              <Circle className="mt-0.5 h-3 w-3 shrink-0 text-[#64748B]" />
            )}
            <span
              className={`text-[9px] leading-tight ${m.done ? "text-[#CBD5E1]" : "text-[#94A3B8]"}`}
            >
              {m.label}
            </span>
          </motion.li>
        ))}
      </ul>
    </HolographicCard>
  );
}
