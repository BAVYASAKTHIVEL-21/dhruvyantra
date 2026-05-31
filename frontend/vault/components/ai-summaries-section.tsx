"use client";

import { Sparkles } from "lucide-react";
import type { AiSummary } from "../types";

export function AiSummariesSection({ summaries }: { summaries: AiSummary[] }) {
  return (
    <section>
      <h3 className="font-heading text-base font-bold text-[#F8FAFC]">
        AI Generated Summaries
      </h3>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {summaries.map((item) => (
          <div
            key={item.id}
            className="dash-glass-card group flex cursor-pointer gap-3 rounded-xl border-[#8B5CF6]/10 p-4 transition-colors hover:border-[#8B5CF6]/25"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#8B5CF6]/30 to-[#EC4899]/20 ring-1 ring-[#8B5CF6]/40">
              <Sparkles className="h-5 w-5 text-[#C4B5FD]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="rounded bg-[#8B5CF6]/25 px-1.5 py-0.5 text-[9px] font-bold text-[#E9D5FF]">
                  AI
                </span>
                <span className="text-[10px] text-[#6B7A90]">{item.pages} pages</span>
              </div>
              <p className="mt-1 text-sm font-medium text-[#F8FAFC]">{item.title}</p>
              <p className="text-[10px] text-[#6B7A90]">{item.subject}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
