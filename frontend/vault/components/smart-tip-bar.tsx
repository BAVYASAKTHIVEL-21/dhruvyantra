"use client";

import { ChevronRight, Lightbulb } from "lucide-react";

export function SmartTipBar() {
  return (
    <div className="vault-smart-tip flex flex-col gap-3 rounded-2xl border border-[#8B5CF6]/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Lightbulb className="h-5 w-5 shrink-0 text-[#A78BFA]" />
        <p className="text-sm text-[#C4D4E8]">
          <span className="font-semibold text-[#E9D5FF]">Pro Tip:</span> Use AI Summaries
          and Smart Tags to revise 2x faster.
        </p>
      </div>
      <button
        type="button"
        className="flex cursor-pointer items-center gap-1 text-sm font-medium text-[#8B5CF6] hover:text-[#C4B5FD]"
      >
        Explore Smart Tags
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
