"use client";

import { Atom, Beaker, Leaf, MoreHorizontal, Sigma } from "lucide-react";
import type { SubjectSummary } from "../types";

const ICONS = {
  physics: Atom,
  chemistry: Beaker,
  math: Sigma,
  biology: Leaf,
  other: MoreHorizontal,
};

const ACCENTS: Record<string, string> = {
  physics: "#38BDF8",
  chemistry: "#EC4899",
  math: "#8B5CF6",
  biology: "#22C55E",
  other: "#94A3B8",
};

export function SubjectCard({
  subject,
  onSelect,
}: {
  subject: SubjectSummary;
  onSelect: (name: SubjectSummary["name"]) => void;
}) {
  const Icon = ICONS[subject.icon];
  const accent = ACCENTS[subject.icon];

  return (
    <button
      type="button"
      onClick={() => onSelect(subject.name)}
      className="dash-glass-card group flex cursor-pointer flex-col items-center rounded-2xl p-4 text-center transition-all hover:border-[#8B5CF6]/25 hover:shadow-[0_0_28px_rgba(139,92,246,0.15)]"
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl ring-1 ring-white/10 transition-transform group-hover:scale-105"
        style={{ background: `${accent}22`, boxShadow: `0 0 20px ${accent}33` }}
      >
        <Icon className="h-6 w-6" style={{ color: accent }} />
      </div>
      <p className="mt-3 font-heading text-sm font-bold text-[#F8FAFC]">{subject.name}</p>
      <p className="mt-0.5 text-[11px] text-[#6B7A90]">
        {subject.resourceCount.toLocaleString()} Resources
      </p>
    </button>
  );
}
