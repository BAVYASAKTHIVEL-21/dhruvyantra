"use client";

import { motion } from "framer-motion";
import { useProfile } from "@/hooks/useProfile";
import { buildMentorInsight } from "@/lib/personalization/dashboard";
import type { ProfileMe } from "@/lib/profile/me-types";

function MentorBrainGraphic() {
  return (
    <svg
      viewBox="0 0 140 140"
      className="h-[7.5rem] w-[7.5rem] shrink-0 md:h-32 md:w-32"
      aria-hidden
    >
      <defs>
        <linearGradient id="mentorBrainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      <ellipse cx="70" cy="72" rx="48" ry="44" fill="none" stroke="url(#mentorBrainGrad)" strokeWidth="1.2" opacity="0.35" />
      <path
        d="M70 28c-10 0-18 8-20 18-8-2-18 4-20 14-5 0-10 5-10 12 0 5 3 10 8 12-3 5-3 12 3 16 5 8 12 14 20 14s15-6 20-14c5-5 5-12 3-16 5-2 10-7 12-12 0-7-5-12-10-12-2-10-12-16-20-16z"
        fill="none"
        stroke="url(#mentorBrainGrad)"
        strokeWidth="1.4"
      />
    </svg>
  );
}

const FALLBACK_PROFILE: ProfileMe = {
  userId: "",
  examType: null,
  targetYear: null,
  weakSubjects: [],
  weakTopics: [],
  dailyStudyHours: 6,
  productiveTime: null,
  parentContact: null,
  onboardingCompleted: false,
  name: "Student",
  targetRank: null,
  role: "Aspirant",
};

export function AiMentorCard() {
  const { profile } = useProfile();
  const insight = buildMentorInsight(profile ?? FALLBACK_PROFILE);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.45 }}
      className="dash-glass-card relative flex h-full flex-col overflow-hidden rounded-2xl p-5 md:p-6"
    >
      <div className="relative flex min-h-0 flex-1 flex-col gap-4 sm:flex-row sm:items-stretch">
        <div className="flex min-h-0 flex-1 flex-col">
          <h2 className="shrink-0 font-heading text-lg font-bold text-[#F8FAFC]">
            AI Mentor Insight
            {profile?.examType ? (
              <span className="ml-2 text-xs font-normal text-[#8B5CF6]">{profile.examType}</span>
            ) : null}
          </h2>
          <blockquote className="mt-4 border-l-2 border-[#8B5CF6]/50 pl-4 text-sm leading-relaxed text-[#B8C5D6] md:text-[15px]">
            {insight.quote.replace(/\*\*(.*?)\*\*/g, "$1")}
          </blockquote>
          <p className="mt-3 text-sm leading-relaxed text-[#94A3B8] md:text-[15px]">
            {insight.action}
          </p>
          <p className="mt-auto pt-5 text-sm font-medium text-[#A78BFA]">
            Let&apos;s improve together!
          </p>
        </div>
        <div className="flex shrink-0 items-center justify-center sm:items-end sm:justify-end">
          <MentorBrainGraphic />
        </div>
      </div>
    </motion.div>
  );
}
