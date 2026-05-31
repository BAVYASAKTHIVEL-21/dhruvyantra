"use client";

import { BookOpen, HelpCircle, FileQuestion } from "lucide-react";
import type { ParentUpcomingEvent } from "@/types/parent-connect";
import { UPCOMING_EVENTS } from "../data";

const EVENT_ICONS = {
  test: FileQuestion,
  revision: BookOpen,
  doubt: HelpCircle,
};

type Props = {
  events?: ParentUpcomingEvent[];
};

export function UpcomingSchedule({ events }: Props) {
  const rows = events ?? UPCOMING_EVENTS;

  return (
    <div className="dash-glass-card rounded-2xl p-5">
      <h3 className="font-heading text-sm font-bold text-[#F8FAFC]">Upcoming Schedule</h3>
      {rows.length === 0 ? (
        <p className="mt-4 text-xs text-[#94A3B8]">No upcoming items on the planner.</p>
      ) : (
        <ul className="mt-4 space-y-0">
          {rows.map((event, i) => {
            const Icon = EVENT_ICONS[event.icon];
            return (
              <li key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
                {i < rows.length - 1 ? (
                  <span className="absolute left-[17px] top-9 h-full w-px bg-white/[0.08]" />
                ) : null}
                <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#8B5CF6]/15">
                  <Icon className="h-4 w-4 text-[#A78BFA]" />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-[#E2E8F0]">{event.title}</p>
                  <span className="mt-1 inline-block rounded-full bg-[#8B5CF6]/15 px-2 py-0.5 text-[10px] font-medium text-[#C4B5FD]">
                    {event.when}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
