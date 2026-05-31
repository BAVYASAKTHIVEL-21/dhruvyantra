"use client";

import type { Recommendation, Resource } from "../types";

const LABEL_STYLES: Record<string, string> = {
  "Suggested for You": "bg-[#8B5CF6]/20 text-[#C4B5FD] ring-[#8B5CF6]/30",
  "Weak Topic": "bg-[#EF4444]/15 text-[#F87171] ring-[#EF4444]/25",
  "Exam Booster": "bg-[#38BDF8]/15 text-[#7DD3FC] ring-[#38BDF8]/25",
};

export function RecommendationCard({
  recommendation,
  resource,
}: {
  recommendation: Recommendation;
  resource: Resource;
}) {
  return (
    <div className="dash-glass-card flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ${LABEL_STYLES[recommendation.label] ?? LABEL_STYLES["Suggested for You"]}`}
        >
          {recommendation.label}
        </span>
        <h3 className="mt-2 font-heading text-sm font-bold text-[#F8FAFC]">{resource.title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-[#94A3B8]">{recommendation.reason}</p>
      </div>
      <a
        href={resource.driveUrl && resource.driveUrl !== "#" ? resource.driveUrl : undefined}
        target="_blank"
        rel="noopener noreferrer"
        className={`btn-gradient-glow flex h-9 shrink-0 items-center justify-center rounded-lg px-5 text-xs font-semibold text-white ${
          resource.driveUrl && resource.driveUrl !== "#"
            ? "cursor-pointer"
            : "pointer-events-none opacity-50"
        }`}
      >
        Open
      </a>
    </div>
  );
}
