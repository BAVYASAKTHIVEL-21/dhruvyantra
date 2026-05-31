"use client";

import { motion } from "framer-motion";
import { BadgeCheck } from "lucide-react";
import { formatDaysRemaining } from "@/lib/exam-schedule";
import type { ParentConnectOverview } from "@/types/parent-connect";
import { STUDENT_PROFILE } from "../data";

type Props = {
  student?: ParentConnectOverview["student"];
};

export function StudentOverviewCard({ student }: Props) {
  const name = student?.name ?? STUDENT_PROFILE.name;
  const role = student?.role ?? STUDENT_PROFILE.role;
  const targetExam = student?.targetExam ?? STUDENT_PROFILE.targetExam;
  const daysRemaining = student?.daysRemaining ?? STUDENT_PROFILE.daysRemaining;
  const nextExamLabel = student?.nextExamLabel ?? null;
  const initial = name.charAt(0).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="parent-student-hero relative overflow-hidden rounded-2xl border border-white/[0.08]"
    >
      <div className="parent-student-hero-bg absolute inset-0" aria-hidden />
      <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#38BDF8] text-2xl font-bold text-white ring-4 ring-white/10">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-2xl font-bold text-[#F8FAFC]">{name}</h2>
            <BadgeCheck className="h-5 w-5 text-[#38BDF8]" />
          </div>
          <p className="mt-1 text-sm text-[#94A3B8]">{role}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#6B7A90]">Target Exam</p>
              <p className="font-medium text-[#E2E8F0]">{targetExam}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#6B7A90]">
                Days to next exam
              </p>
              <p className="font-semibold text-[#34D399]">
                {daysRemaining != null ? formatDaysRemaining(daysRemaining) : "—"}
              </p>
              {nextExamLabel ? (
                <p className="mt-1 max-w-[220px] text-[10px] leading-snug text-[#94A3B8]">
                  {nextExamLabel}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
