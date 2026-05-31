"use client";

import { motion } from "framer-motion";
import { Calendar, Sparkles, TrendingUp } from "lucide-react";
import { HolographicCard } from "./holographic-card";

const weakTopics = [
  { name: "Rotational Motion", level: "Low", color: "#38BDF8" },
  { name: "Organic Chemistry", level: "Medium", color: "#F59E0B" },
];

export function ProgressWidget() {
  const progress = 72;
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <HolographicCard
      glow="purple"
      className="relative z-30 mx-auto mt-2 w-full max-w-[230px] p-4 sm:mt-4 lg:absolute lg:right-[2%] lg:top-[8%] lg:mx-0"
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1, y: [0, -8, 0] }}
      transition={{
        opacity: { duration: 0.8, delay: 0.3 },
        x: { duration: 0.8, delay: 0.3 },
        scale: { duration: 0.8, delay: 0.3 },
        y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
      }}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8B5CF6]">
          AI Progress
        </span>
        <Sparkles className="h-3.5 w-3.5 text-[#F59E0B]" />
      </div>

      <div className="flex items-center gap-4">
        <div className="relative h-[84px] w-[84px] shrink-0">
          <svg className="-rotate-90" width="84" height="84" viewBox="0 0 88 88">
            <circle
              cx="44"
              cy="44"
              r="36"
              fill="none"
              stroke="rgba(139,92,246,0.12)"
              strokeWidth="6"
            />
            <motion.circle
              cx="44"
              cy="44"
              r="36"
              fill="none"
              stroke="url(#progressGrad)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.6 }}
            />
            <defs>
              <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#38BDF8" />
              </linearGradient>
            </defs>
          </svg>
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ opacity: [0.9, 1, 0.9] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <span className="font-heading text-xl font-bold text-[#F8FAFC]">
              {progress}%
            </span>
          </motion.div>
        </div>

        <div>
          <p className="text-[10px] text-[#94A3B8]">Overall mastery</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-[#38BDF8]">
            <TrendingUp className="h-3 w-3" />
            Keep shining!
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 border-t border-white/10 pt-3">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-[#94A3B8]">
          Weak Topics
        </p>
        {weakTopics.map((topic, i) => (
          <motion.div
            key={topic.name}
            className="flex items-center justify-between rounded-lg bg-white/5 px-2 py-1.5"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + i * 0.1 }}
          >
            <span className="text-[10px] text-[#E2E8F0]">{topic.name}</span>
            <span
              className="rounded-full px-2 py-0.5 text-[8px] font-medium"
              style={{
                background: `${topic.color}22`,
                color: topic.color,
              }}
            >
              {topic.level}
            </span>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="mt-2.5 flex items-center gap-2 rounded-lg border border-[#8B5CF6]/20 bg-[#8B5CF6]/10 px-2.5 py-2"
        animate={{ boxShadow: ["0 0 0px rgba(139,92,246,0)", "0 0 12px rgba(139,92,246,0.2)", "0 0 0px rgba(139,92,246,0)"] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <Calendar className="h-3.5 w-3.5 text-[#8B5CF6]" />
        <div>
          <p className="text-[9px] text-[#94A3B8]">Upcoming Revision</p>
          <p className="text-[11px] font-semibold text-[#F8FAFC]">2 Topics Today</p>
        </div>
      </motion.div>
    </HolographicCard>
  );
}
