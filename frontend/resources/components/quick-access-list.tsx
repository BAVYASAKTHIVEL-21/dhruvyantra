"use client";

import { FileText, GitBranch, LayoutGrid, Sigma, Zap } from "lucide-react";
import type { QuickAccessItem } from "../types";

const ICON_MAP: Record<string, typeof FileText> = {
  formula: Sigma,
  mindmap: LayoutGrid,
  notes: FileText,
  diagram: GitBranch,
  pyq: Zap,
};

export function QuickAccessList({
  items,
  onSelect,
}: {
  items: QuickAccessItem[];
  onSelect: (filterTag: string) => void;
}) {
  return (
    <div className="dash-glass-card rounded-2xl p-5">
      <h3 className="font-heading text-sm font-bold text-[#F8FAFC]">Quick Access</h3>
      <ul className="mt-3 space-y-1">
        {items.map((item) => {
          const Icon = ICON_MAP[item.icon] ?? FileText;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.filterTag)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm text-[#94A3B8] transition-colors hover:bg-white/[0.04] hover:text-[#F8FAFC]"
              >
                <Icon className="h-4 w-4 text-[#8B5CF6]" />
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
