"use client";

import { AlertCircle, Bell, CheckCircle2 } from "lucide-react";
import type { ParentAlertItem } from "@/types/parent-connect";
import { ALERTS } from "../data";

const ALERT_STYLES = {
  warning: {
    icon: AlertCircle,
    bg: "bg-[#EF4444]/15",
    text: "text-[#F87171]",
    ring: "ring-[#EF4444]/25",
  },
  info: {
    icon: Bell,
    bg: "bg-[#F59E0B]/15",
    text: "text-[#FBBF24]",
    ring: "ring-[#F59E0B]/25",
  },
  success: {
    icon: CheckCircle2,
    bg: "bg-[#22C55E]/15",
    text: "text-[#34D399]",
    ring: "ring-[#22C55E]/25",
  },
};

type Props = {
  alerts?: ParentAlertItem[];
};

export function AlertsPanel({ alerts }: Props) {
  const rows = alerts ?? ALERTS;

  return (
    <div className="dash-glass-card rounded-2xl p-5">
      <h3 className="font-heading text-sm font-bold text-[#F8FAFC]">Important Alerts</h3>
      {rows.length === 0 ? (
        <p className="mt-4 text-xs text-[#94A3B8]">No alerts right now — all on track.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((alert) => {
            const style = ALERT_STYLES[alert.type];
            const Icon = style.icon;
            return (
              <li
                key={alert.id}
                className={`flex gap-3 rounded-xl border border-white/[0.06] p-3 ring-1 ${style.ring}`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${style.bg}`}>
                  <Icon className={`h-4 w-4 ${style.text}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[#E2E8F0]">{alert.title}</p>
                  <p className="mt-0.5 text-[10px] text-[#6B7A90]">{alert.time}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
