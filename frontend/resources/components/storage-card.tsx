"use client";

import { getStorageUsage } from "../services/resourceService";

export function StorageCard() {
  const { usedGb, totalGb } = getStorageUsage();
  const pct = Math.round((usedGb / totalGb) * 100);

  return (
    <div className="dash-glass-card rounded-2xl p-5">
      <h3 className="font-heading text-sm font-bold text-[#F8FAFC]">Storage</h3>
      <p className="mt-2 text-lg font-bold tabular-nums text-[#F8FAFC]">
        {usedGb} GB <span className="text-sm font-normal text-[#6B7A90]">/ {totalGb} GB used</span>
      </p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#EC4899]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-[#6B7A90]">{pct}% of your library vault</p>
      <button
        type="button"
        className="mt-4 w-full cursor-pointer rounded-xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 py-2 text-xs font-semibold text-[#C4B5FD] transition-colors hover:bg-[#8B5CF6]/20"
      >
        Manage Storage
      </button>
    </div>
  );
}
