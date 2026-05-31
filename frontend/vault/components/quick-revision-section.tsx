"use client";

import { AlertTriangle, Bookmark, Target, Zap } from "lucide-react";
import type { QuickRevision } from "../types";

const ICONS = {
  formula: Zap,
  mistakes: AlertTriangle,
  weak: Target,
  weightage: Bookmark,
};

export function QuickRevisionSection({ items }: { items: QuickRevision[] }) {
  return (
    <section>
      <h3 className="font-heading text-base font-bold text-[#F8FAFC]">Quick Revision</h3>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <div
              key={item.id}
              className="vault-revision-card relative overflow-hidden rounded-xl border border-[#8B5CF6]/15 p-4"
            >
              <div className="absolute right-0 top-0 h-8 w-8 bg-[#8B5CF6]/30" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
              <Icon className="h-6 w-6 text-[#A78BFA]" />
              <p className="mt-2 text-sm font-medium text-[#F8FAFC]">{item.label}</p>
              <p className="text-[11px] text-[#6B7A90]">{item.fileCount} files</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
