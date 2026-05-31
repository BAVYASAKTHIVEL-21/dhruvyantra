"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { FOCUS_QUEUE, type FocusTask } from "../data";

export function FocusQueueCard() {
  const [tasks, setTasks] = useState<FocusTask[]>(FOCUS_QUEUE);
  const done = tasks.filter((t) => t.done).length;
  const pct = Math.round((done / tasks.length) * 100);

  const toggle = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  };

  return (
    <div className="dash-glass-card flex h-full flex-col rounded-2xl p-5">
      <h3 className="font-heading text-base font-bold text-[#F8FAFC]">
        Today&apos;s Focus Queue
      </h3>
      <ul className="mt-4 flex-1 space-y-2">
        {tasks.map((task) => (
          <li key={task.id}>
            <button
              type="button"
              onClick={() => toggle(task.id)}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-left transition-colors hover:border-[#8B5CF6]/20"
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                  task.done
                    ? "border-[#8B5CF6] bg-[#8B5CF6]/30 text-[#F8FAFC]"
                    : "border-white/20 bg-transparent"
                }`}
              >
                {task.done ? <Check className="h-3 w-3" /> : null}
              </span>
              <span
                className={`flex-1 text-sm ${
                  task.done ? "text-[#6B7A90] line-through" : "text-[#E2E8F0]"
                }`}
              >
                {task.title}
              </span>
              <span className="text-xs text-[#6B7A90]">{task.duration}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-4 border-t border-white/[0.06] pt-4">
        <div className="mb-2 flex justify-between text-xs text-[#94A3B8]">
          <span>
            {done} of {tasks.length} tasks completed
          </span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
