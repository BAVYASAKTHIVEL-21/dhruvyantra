"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FileQuestion,
  Layers,
  Play,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { MockRecoveryResourcesList } from "./mock-recovery-resources-list";
import { Button } from "@/components/ui/button";
import { useMockCenter } from "@/hooks/useMockCenter";
import { useProfile } from "@/hooks/useProfile";
import type { MockTypeCard } from "@/types/mock-center";

const STAT_ICONS = [FileQuestion, Trophy, Clock, Calendar] as const;

const TYPE_ICONS = {
  full: Layers,
  chapter: BookOpen,
  pyq: Zap,
} as const;

export function MockCenterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useProfile();
  const { overview, loading } = useMockCenter();

  const examFromUrl = searchParams.get("exam");
  const subtitle = useMemo(() => {
    if (overview.headline) return overview.headline;
    return "Full-length and chapter tests under real exam conditions.";
  }, [overview.headline]);

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#8B5CF6]">
            Practice Arena
          </p>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-[#F8FAFC] lg:text-3xl">
            Mock Center
          </h1>
          <p className="mt-1 max-w-xl text-sm text-[#94A3B8] md:text-[15px]">{subtitle}</p>
          {examFromUrl && profile?.examType && examFromUrl !== profile.examType ? (
            <p className="mt-2 text-xs text-[#FBBF24]">
              Showing {profile.examType} mocks from your profile.
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          className="btn-gradient-glow h-11 shrink-0 cursor-pointer rounded-xl px-6 text-sm font-semibold text-white"
          onClick={() => router.push(overview.upcoming.startHref)}
        >
          <Play className="mr-2 h-4 w-4" />
          Start Planned Mock
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="dash-glass-card mt-8 overflow-hidden rounded-2xl border-[#8B5CF6]/20 p-6 md:p-7"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8B5CF6]/30 to-[#EC4899]/20 ring-1 ring-[#8B5CF6]/30">
              <Target className="h-7 w-7 text-[#C4B5FD]" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#A78BFA]">
                Up Next · from planner
              </p>
              <h2 className="font-heading text-xl font-bold text-[#F8FAFC]">
                {loading ? "Loading…" : overview.upcoming.title}
              </h2>
              <p className="mt-1 flex items-center gap-2 text-sm text-[#94A3B8]">
                <Calendar className="h-4 w-4 text-[#8B5CF6]" />
                {overview.upcoming.schedule}
              </p>
              <p className="mt-2 text-sm text-[#6B7A90]">
                {overview.upcoming.duration} · {overview.upcoming.questions} questions ·{" "}
                {overview.upcoming.subjects}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full cursor-pointer rounded-xl border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#E9D5FF] hover:bg-[#8B5CF6]/20 lg:w-auto"
            onClick={() => router.push(overview.upcoming.startHref)}
          >
            Start Session
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
        {overview.stats.map((stat, i) => {
          const Icon = STAT_ICONS[i] ?? FileQuestion;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="dash-glass-card rounded-2xl p-4"
            >
              <Icon className="h-5 w-5 text-[#8B5CF6]" />
              <p className="mt-2 font-heading text-xl font-bold text-[#F8FAFC]">
                {loading ? "…" : stat.value}
              </p>
              <p className="text-xs text-[#6B7A90]">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {!loading && overview.recoveryResources.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="dash-glass-card mt-6 rounded-2xl p-6"
        >
          <MockRecoveryResourcesList
            resources={overview.recoveryResources}
            title="From your latest mock — study these next"
          />
        </motion.div>
      ) : !loading ? (
        <div className="dash-glass-card mt-6 rounded-2xl p-5 text-sm text-[#94A3B8]">
          Complete a mock to get recovery materials linked to your weak topics. Use{" "}
          <span className="text-[#C4B5FD]">Prep materials</span> below to browse the library
          before you start.
        </div>
      ) : null}

      <h2 className="mt-8 font-heading text-lg font-bold text-[#F8FAFC]">
        Choose a test type
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {overview.mockTypes.map((mock: MockTypeCard, i: number) => {
          const Icon = TYPE_ICONS[mock.id];
          return (
            <motion.div
              key={mock.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.06 }}
              className="dash-glass-card group rounded-2xl p-5 transition-all hover:border-[#8B5CF6]/25"
            >
              <Icon className="h-6 w-6 text-[#C4B5FD] transition-colors group-hover:text-[#E9D5FF]" />
              <h3 className="mt-3 font-semibold text-[#F8FAFC]">{mock.title}</h3>
              <p className="mt-1 text-sm text-[#94A3B8]">{mock.description}</p>
              <p className="mt-3 text-xs text-[#6B7A90]">{mock.meta}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="btn-gradient-glow h-9 cursor-pointer rounded-lg px-4 text-xs"
                  onClick={() => router.push(mock.href)}
                >
                  Start mock
                </Button>
                {mock.prepHref ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-9 cursor-pointer rounded-lg border-white/10 px-4 text-xs"
                    onClick={() => router.push(mock.prepHref!)}
                  >
                    Prep materials
                  </Button>
                ) : null}
              </div>
            </motion.div>
          );
        })}
      </div>

      <h2 className="mt-8 font-heading text-lg font-bold text-[#F8FAFC]">
        Planner mock history
      </h2>
      <div className="mt-4 space-y-3">
        {overview.recentAttempts.length === 0 ? (
          <div className="dash-glass-card rounded-2xl p-5 text-sm text-[#94A3B8]">
            No mock tasks in your planner yet. Complete study tasks and Mission Control will
            schedule mocks based on your {profile?.examType ?? "exam"} profile.
          </div>
        ) : (
          overview.recentAttempts.map((attempt, i) => (
            <motion.div
              key={attempt.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="dash-glass-card flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    attempt.status === "Completed"
                      ? "bg-[#34D399]/15 text-[#34D399]"
                      : attempt.status === "In Progress"
                        ? "bg-[#38BDF8]/15 text-[#38BDF8]"
                        : "bg-[#F472B6]/15 text-[#F472B6]"
                  }`}
                >
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-[#F8FAFC]">{attempt.title}</p>
                  <p className="text-xs text-[#6B7A90]">
                    {attempt.dateLabel} · {attempt.subject}
                    {attempt.topic ? ` · ${attempt.topic}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#F8FAFC]">{attempt.durationLabel}</p>
                  <p className="text-xs text-[#6B7A90]">Planned</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#A78BFA]">{attempt.status}</p>
                  <p className="text-xs text-[#6B7A90]">Status</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(attempt.href)}
                  className="cursor-pointer text-sm font-medium text-[#8B5CF6] hover:text-[#C4B5FD]"
                >
                  {attempt.status === "Completed" ? "Resources" : "Start"}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <p className="mt-8 text-center text-sm text-[#6B7A90]">
        <Link href="/dashboard" className="text-[#A78BFA] hover:underline">
          ← Back to Mission Control
        </Link>
      </p>
    </>
  );
}
