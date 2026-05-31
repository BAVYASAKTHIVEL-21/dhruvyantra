"use client";

import { CONNECTION_TABS, type ConnectionTab } from "../data";

export function ConnectionTabs({
  active,
  onChange,
}: {
  active: ConnectionTab;
  onChange: (tab: ConnectionTab) => void;
}) {
  return (
    <div className="focus-tabs inline-flex max-w-full flex-wrap rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
      {CONNECTION_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`cursor-pointer rounded-lg px-3 py-2 text-xs font-medium transition-all sm:px-4 sm:text-sm ${
            active === tab.id
              ? "focus-tab-active text-[#F8FAFC] shadow-[0_0_20px_rgba(139,92,246,0.25)]"
              : "text-[#94A3B8] hover:text-[#E2E8F0]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
