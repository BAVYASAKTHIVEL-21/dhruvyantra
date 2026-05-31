"use client";

import { Brain } from "lucide-react";
import type { ParentConnectOverview } from "@/types/parent-connect";
import { AI_PARENT_INSIGHT } from "../data";

function ParentClockGraphic() {
  return (
    <svg viewBox="0 0 80 80" className="h-16 w-16 shrink-0" aria-hidden>
      <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(139,92,246,0.3)" strokeWidth="2" />
      <circle
        cx="40"
        cy="40"
        r="34"
        fill="none"
        stroke="url(#parentClockGrad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="80 134"
        strokeDashoffset="-20"
        className="drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]"
      />
      <line x1="40" y1="40" x2="40" y2="22" stroke="#C4B5FD" strokeWidth="2" strokeLinecap="round" />
      <line x1="40" y1="40" x2="52" y2="40" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" />
      <circle cx="40" cy="40" r="3" fill="#8B5CF6" />
      <defs>
        <linearGradient id="parentClockGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

type Props = {
  insight?: ParentConnectOverview["aiInsight"];
};

export function AiInsightsCard({ insight }: Props) {
  return (
    <div className="dash-glass-card relative overflow-hidden rounded-2xl border-[#8B5CF6]/15 p-5">
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#8B5CF6]/20 blur-2xl" />
      <div className="relative flex gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8B5CF6]/20">
          <Brain className="h-5 w-5 text-[#A78BFA]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8B5CF6]">
            AI Insights for Parents
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#C4D4E8]">
            {insight ?? AI_PARENT_INSIGHT}
          </p>
        </div>
        <ParentClockGraphic />
      </div>
    </div>
  );
}
