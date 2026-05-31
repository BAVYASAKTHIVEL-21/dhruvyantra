"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { TIME_FILTERS } from "../data";

export function TimeFilter() {
  const [value, setValue] = useState(TIME_FILTERS[0]);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="insights-time-filter flex cursor-pointer items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-[#E2E8F0] transition-colors hover:border-[#8B5CF6]/30"
      >
        {value}
        <ChevronDown className={`h-4 w-4 text-[#6B7A90] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <ul className="absolute right-0 z-20 mt-2 min-w-[160px] overflow-hidden rounded-xl border border-white/[0.1] bg-[#111827]/95 py-1 shadow-xl backdrop-blur-xl">
          {TIME_FILTERS.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                onClick={() => {
                  setValue(opt);
                  setOpen(false);
                }}
                className={`w-full cursor-pointer px-4 py-2 text-left text-sm transition-colors hover:bg-[#8B5CF6]/15 ${
                  value === opt ? "text-[#C4B5FD]" : "text-[#94A3B8]"
                }`}
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
