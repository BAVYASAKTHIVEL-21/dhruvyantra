"use client";

import { Bell } from "lucide-react";
import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  getPreferences,
  getSummary,
  getUpcomingReminders,
} from "../services/alertsService";

const TOOLTIP_STYLE = {
  backgroundColor: "rgba(17, 24, 39, 0.95)",
  border: "1px solid rgba(139, 92, 246, 0.25)",
  borderRadius: "12px",
  color: "#F8FAFC",
  fontSize: "12px",
};

type Summary = ReturnType<typeof getSummary>;
type Reminder = { id: string; title: string; when: string; urgent: boolean };

export function AlertsSidebar({
  summary: summaryOverride,
  reminders: remindersOverride,
}: {
  summary?: Summary;
  reminders?: Reminder[];
} = {}) {
  const summary = summaryOverride ?? getSummary();
  const reminders = remindersOverride ?? getUpcomingReminders();
  const [prefs, setPrefs] = useState(getPreferences());

  return (
    <aside className="space-y-4">
      <div className="dash-glass-card rounded-2xl p-5">
        <h3 className="font-heading text-sm font-bold text-[#F8FAFC]">Alert Summary</h3>
        <div className="relative mt-4 h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={summary.breakdown}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={68}
                paddingAngle={2}
                stroke="transparent"
              >
                {summary.breakdown.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-heading text-xl font-bold text-[#F8FAFC]">
              {summary.total}
            </span>
            <span className="text-[10px] text-[#6B7A90]">Total Alerts</span>
          </div>
        </div>
        <ul className="mt-3 space-y-1.5">
          {summary.breakdown.map((item) => (
            <li key={item.name} className="flex justify-between text-xs">
              <span className="flex items-center gap-2 text-[#94A3B8]">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}
              </span>
              <span className="text-[#E2E8F0]">{item.value}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="dash-glass-card rounded-2xl p-5">
        <h3 className="font-heading text-sm font-bold text-[#F8FAFC]">Upcoming Reminders</h3>
        <ul className="mt-3 space-y-3">
          {reminders.length === 0 ? (
            <li className="text-xs text-[#6B7A90]">No upcoming reminders from planner.</li>
          ) : (
            reminders.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-2 border-b border-white/[0.05] pb-3 last:border-0 last:pb-0"
              >
                <p className="text-sm text-[#E2E8F0]">{r.title}</p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    r.urgent
                      ? "bg-[#8B5CF6]/25 text-[#C4B5FD] ring-1 ring-[#8B5CF6]/40"
                      : "bg-[#38BDF8]/15 text-[#7DD3FC]"
                  }`}
                >
                  {r.when}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="dash-glass-card rounded-2xl p-5">
        <h3 className="font-heading text-sm font-bold text-[#F8FAFC]">Alert Preferences</h3>
        <ul className="mt-3 space-y-3">
          {prefs.map((pref) => (
            <li key={pref.id} className="flex items-center justify-between gap-3">
              <span className="text-sm text-[#94A3B8]">{pref.label}</span>
              <button
                type="button"
                role="switch"
                aria-checked={pref.enabled}
                onClick={() =>
                  setPrefs((p) =>
                    p.map((x) =>
                      x.id === pref.id ? { ...x, enabled: !x.enabled } : x,
                    ),
                  )
                }
                className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                  pref.enabled ? "bg-[#8B5CF6] shadow-[0_0_12px_rgba(139,92,246,0.4)]" : "bg-white/10"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${
                    pref.enabled ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="alerts-motivation relative overflow-hidden rounded-2xl border border-[#8B5CF6]/20 p-5">
        <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#8B5CF6]/25 blur-2xl" />
        <div className="relative flex gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#8B5CF6]/20 ring-1 ring-[#8B5CF6]/40 shadow-[0_0_24px_rgba(139,92,246,0.3)]">
            <Bell className="h-7 w-7 text-[#C4B5FD]" />
          </div>
          <div>
            <h3 className="font-heading text-sm font-bold text-[#F8FAFC]">
              Never Miss What Matters
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[#94A3B8]">
              Enable smart alerts to stay ahead in your preparation journey.
            </p>
            <button
              type="button"
              className="btn-gradient-glow mt-3 cursor-pointer rounded-lg px-4 py-2 text-xs font-semibold text-white"
            >
              Customize Alerts
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
