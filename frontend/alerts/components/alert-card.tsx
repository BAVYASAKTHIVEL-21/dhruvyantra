"use client";

import {
  BarChart3,
  Calendar,
  CheckCircle2,
  FileText,
  MessageCircle,
  Target,
  AlertTriangle,
} from "lucide-react";
import type { AlertItem } from "../data";

const ICONS = {
  calendar: Calendar,
  warning: AlertTriangle,
  success: CheckCircle2,
  mentor: MessageCircle,
  chart: BarChart3,
  plan: FileText,
  test: Target,
};

const ICON_STYLES = {
  calendar: "bg-[#8B5CF6]/20 text-[#C4B5FD] ring-[#8B5CF6]/30",
  warning: "bg-[#F97316]/20 text-[#FB923C] ring-[#F97316]/30",
  success: "bg-[#22C55E]/20 text-[#86EFAC] ring-[#22C55E]/30",
  mentor: "bg-[#8B5CF6]/20 text-[#C4B5FD] ring-[#8B5CF6]/30",
  chart: "bg-[#38BDF8]/20 text-[#7DD3FC] ring-[#38BDF8]/30",
  plan: "bg-[#EC4899]/20 text-[#F9A8D4] ring-[#EC4899]/30",
  test: "bg-[#F97316]/20 text-[#FB923C] ring-[#F97316]/30",
};

const DOT_COLORS = {
  calendar: "#8B5CF6",
  warning: "#F97316",
  success: "#22C55E",
  mentor: "#8B5CF6",
  chart: "#38BDF8",
  plan: "#EC4899",
  test: "#F97316",
};

export function AlertCard({ alert }: { alert: AlertItem }) {
  const Icon = ICONS[alert.icon];
  const iconStyle = ICON_STYLES[alert.icon];

  return (
    <article className="dash-glass-card group flex gap-4 rounded-2xl p-4 transition-all hover:border-[#8B5CF6]/20 hover:shadow-[0_0_24px_rgba(139,92,246,0.08)]">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${iconStyle}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="font-heading text-sm font-bold text-[#F8FAFC]">{alert.title}</h3>
          <span className="shrink-0 text-[11px] text-[#6B7A90]">{alert.time}</span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-[#94A3B8]">{alert.message}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-[#94A3B8]">
            {alert.source}
          </span>
          {alert.important ? (
            <span className="rounded-full bg-[#8B5CF6]/20 px-2 py-0.5 text-[10px] font-semibold text-[#C4B5FD] ring-1 ring-[#8B5CF6]/30">
              Important
            </span>
          ) : null}
        </div>
      </div>
      <span
        className="mt-2 h-2 w-2 shrink-0 rounded-full opacity-80"
        style={{ backgroundColor: DOT_COLORS[alert.icon] }}
        aria-hidden
      />
    </article>
  );
}
