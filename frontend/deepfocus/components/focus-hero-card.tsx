"use client";

import { motion } from "framer-motion";
import { Coffee, Pause, Play, RotateCcw, Target, Waves } from "lucide-react";
import { useFocusTimer } from "@/hooks/useFocusTimer";
import type { FocusSessionMeta } from "@/hooks/useFocusTimer";
import { Button } from "@/components/ui/button";
import { FOCUS_MODE_CONFIG, SESSION_DETAILS, type FocusTab } from "../data";
import { FocusAtmospherePanel } from "./focus-atmosphere-panel";

export type FocusSessionDetails = FocusSessionMeta & {
  subjectLine: string;
  priority: string;
  durationSeconds?: number;
};

function formatTimer(seconds: number, useHours: boolean) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (useHours || h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function FocusHeroCard({
  mode,
  session = {
    topic: "Rotational Motion",
    subject: "Physics",
    subjectLine: SESSION_DETAILS.subject,
    target: SESSION_DETAILS.target,
    estimated: SESSION_DETAILS.estimated,
    startTime: SESSION_DETAILS.startTime,
    priority: SESSION_DETAILS.priority,
    durationSeconds: undefined,
  },
  onModeRestored,
}: {
  mode: FocusTab;
  session?: FocusSessionDetails;
  onModeRestored?: (mode: FocusTab) => void;
}) {
  const config = FOCUS_MODE_CONFIG[mode];
  const workSeconds = session.durationSeconds ?? config.workSeconds;
  const phaseTotalSeconds = workSeconds;

  const {
    cycle,
    isBreak,
    running,
    seconds,
    elapsedSeconds,
    hydrated,
    toggleRunning,
    resetAll,
  } = useFocusTimer({
    mode,
    meta: {
      topic: session.topic,
      subject: session.subject,
      target: session.target,
      estimated: session.estimated,
      startTime: session.startTime,
      durationSeconds: workSeconds,
    },
    workSeconds,
    phaseTotalSeconds,
    breakSeconds: config.breakSeconds,
    totalCycles: config.totalCycles,
    onModeRestored,
  });

  const initialPhaseSeconds = isBreak
    ? (config.breakSeconds ?? config.workSeconds)
    : phaseTotalSeconds;
  const progress =
    initialPhaseSeconds > 0 ? 1 - seconds / initialPhaseSeconds : 0;
  const circumference = 2 * Math.PI * 76;
  const strokeDashoffset = circumference * (1 - Math.min(progress, 1));

  const sessionText = (() => {
    if (mode === "pomodoro") {
      const phase = isBreak ? "Break" : "Focus";
      return `${phase} · Round ${cycle}/${config.totalCycles}`;
    }
    if (mode === "flow") {
      return `Flow block ${cycle}/${config.totalCycles}`;
    }
    return `Session ${cycle}/${config.totalCycles}`;
  })();

  const startLabel =
    mode === "pomodoro"
      ? isBreak
        ? "Start Break"
        : "Start Pomodoro"
      : mode === "flow"
        ? "Enter Flow"
        : "Start Focus";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="dash-glass-card overflow-hidden rounded-2xl border-[#8B5CF6]/10"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(220px,0.9fr)_1.1fr_1fr]">
        <FocusAtmospherePanel
          topic={session.topic}
          subject={session.subject}
          elapsedSeconds={elapsedSeconds}
          secondsRemaining={seconds}
          running={running}
          cycle={cycle}
          totalCycles={config.totalCycles}
        />

        <div className="flex flex-col items-center justify-center border-b border-white/[0.06] px-4 py-8 lg:border-b-0 lg:border-r lg:py-10">
          {!hydrated ? (
            <p className="text-sm text-[#94A3B8]">Restoring session…</p>
          ) : (
            <>
              <div className="relative flex h-[11.5rem] w-[11.5rem] items-center justify-center md:h-[12.5rem] md:w-[12.5rem]">
                <svg
                  className="focus-timer-ring absolute inset-0 h-full w-full -rotate-90"
                  viewBox="0 0 200 200"
                >
                  <circle
                    cx="100"
                    cy="100"
                    r="76"
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="5"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="76"
                    fill="none"
                    stroke={
                      isBreak && mode === "pomodoro"
                        ? "url(#focusBreakGrad)"
                        : "url(#focusTimerGrad)"
                    }
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="focusTimerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                    <linearGradient id="focusBreakGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#22C55E" />
                      <stop offset="100%" stopColor="#38BDF8" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="relative z-10 flex max-w-[72%] flex-col items-center justify-center text-center">
                  {mode === "pomodoro" && isBreak ? (
                    <Coffee className="mb-1 h-5 w-5 text-[#34D399]" />
                  ) : mode === "flow" ? (
                    <Waves className="mb-1 h-5 w-5 text-[#38BDF8]" />
                  ) : null}
                  <p className="font-heading text-[1.65rem] font-bold tabular-nums leading-none tracking-tight text-[#F8FAFC] sm:text-[1.85rem]">
                    {formatTimer(seconds, config.useHours)}
                  </p>
                  <p className="mt-2 max-w-[140px] text-center text-[11px] leading-tight text-[#94A3B8]">
                    {sessionText}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={resetAll}
                  className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#94A3B8] hover:text-[#F8FAFC]"
                  aria-label="Reset session"
                >
                  <RotateCcw className="h-5 w-5" />
                </button>
                <Button
                  type="button"
                  onClick={toggleRunning}
                  className="btn-gradient-glow inline-flex h-12 min-w-[170px] cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white sm:text-base"
                  aria-label={running ? "Pause focus session" : startLabel}
                >
                  {running ? (
                    <>
                      <Pause className="h-4 w-4 shrink-0" aria-hidden />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 shrink-0 fill-current" aria-hidden />
                      {startLabel}
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col justify-center p-6 lg:p-8">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-[#6B7A90]">
              Today&apos;s Focus
            </p>
            {hydrated && running ? (
              <span className="rounded-full bg-[#22C55E]/15 px-2 py-0.5 text-[10px] font-medium text-[#4ADE80] ring-1 ring-[#22C55E]/25">
                Live
              </span>
            ) : null}
          </div>
          <p className="font-heading text-lg font-bold text-[#F8FAFC]">
            {session.subjectLine}
          </p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-[#6B7A90]">Priority</span>
              <span className="rounded-full bg-[#EF4444]/15 px-2 py-0.5 text-xs font-medium text-[#F87171] ring-1 ring-[#EF4444]/25">
                {session.priority}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7A90]">Target</span>
              <span className="text-right font-medium text-[#E2E8F0]">
                {session.target}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7A90]">Estimated Time</span>
              <span className="font-medium text-[#E2E8F0]">{session.estimated}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7A90]">Start Time</span>
              <span className="font-medium text-[#E2E8F0]">{session.startTime}</span>
            </div>
            {mode === "pomodoro" ? (
              <div className="flex justify-between border-t border-white/[0.06] pt-3">
                <span className="text-[#6B7A90]">Pomodoro rhythm</span>
                <span className="font-medium text-[#34D399]">25m · 5m break</span>
              </div>
            ) : null}
            {mode === "flow" ? (
              <div className="flex justify-between border-t border-white/[0.06] pt-3">
                <span className="text-[#6B7A90]">Flow block</span>
                <span className="font-medium text-[#38BDF8]">50 min / block</span>
              </div>
            ) : null}
          </div>
          <div className="mt-6 flex justify-end">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#38BDF8]/15 ring-1 ring-[#38BDF8]/25">
              <Target className="h-7 w-7 text-[#38BDF8]" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
