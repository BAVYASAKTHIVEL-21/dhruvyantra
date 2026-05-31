"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";

function InsightBrainGraphic() {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-24 shrink-0 md:h-28 md:w-28" aria-hidden>
      <defs>
        <linearGradient id="insightBrainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        <filter id="insightBrainGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <ellipse
        cx="60"
        cy="62"
        rx="42"
        ry="38"
        fill="none"
        stroke="url(#insightBrainGrad)"
        strokeWidth="1"
        opacity="0.4"
        filter="url(#insightBrainGlow)"
      />
      <path
        d="M60 24c-9 0-16 7-18 16-7-2-16 4-17 13-4 0-9 4-9 11 0 4 3 9 7 11-3 4-3 10 3 14 4 7 11 12 18 12s14-5 18-12c4-4 4-10 2-14 4-2 9-6 10-11 0-6-4-11-9-11-2-9-9-15-17-15z"
        fill="none"
        stroke="url(#insightBrainGrad)"
        strokeWidth="1.3"
        filter="url(#insightBrainGlow)"
      />
      <circle cx="48" cy="42" r="2" fill="#38BDF8" opacity="0.9" />
      <circle cx="72" cy="42" r="2" fill="#8B5CF6" opacity="0.9" />
    </svg>
  );
}

export function AiInsightCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="dash-glass-card relative overflow-hidden rounded-2xl border-[#8B5CF6]/15 p-5 md:p-6"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#8B5CF6]/15 blur-3xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Quote className="h-4 w-4 text-[#8B5CF6]" />
            <h3 className="font-heading text-base font-bold text-[#F8FAFC]">AI Insight</h3>
          </div>
          <blockquote className="mt-4 border-l-2 border-[#8B5CF6]/40 pl-4 text-sm leading-relaxed text-[#C4D4E8]">
            You are improving steadily!
            <br />
            Focus more on Rotational Motion and Electrostatics.
          </blockquote>
          <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
            <p className="text-xs font-medium uppercase tracking-wider text-[#6B7A90]">
              Recommended Action
            </p>
            <p className="mt-1 text-sm text-[#E2E8F0]">
              Revise weak topics for 2 more hours this week.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <InsightBrainGraphic />
        </div>
      </div>
    </motion.div>
  );
}
