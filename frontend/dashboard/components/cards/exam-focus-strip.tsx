"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Clock, FlaskConical, Layers, Sparkles, Target, Zap } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { buildExamFocusModules } from "@/lib/personalization/dashboard";
import { examFocusResourcesHref } from "@/lib/mission-control/navigation";

const ICONS = {
  "bio-revision": LeafIcon,
  "ncert-tracker": BookOpen,
  "diagram-practice": Layers,
  "rapid-revision": Zap,
  "math-widgets": Target,
  "advanced-pyqs": Sparkles,
  "problem-solving": FlaskConical,
  "timed-modules": Clock,
} as const;

function LeafIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={props.className} aria-hidden>
      <path
        d="M12 3c-4 5-6 9-6 14a6 6 0 0 0 12 0c0-5-2-9-6-14z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function ExamFocusStrip() {
  const { profile, loading } = useProfile();
  const modules = profile ? buildExamFocusModules(profile) : [];

  if (loading && modules.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[108px] animate-pulse rounded-2xl bg-white/[0.04]" />
        ))}
      </motion.div>
    );
  }

  if (modules.length === 0 || !profile) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.4 }}
      className="mt-5"
      aria-label="Exam focus modules"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-[#94A3B8]">
          {profile.examType ?? "Exam"} Focus
        </h2>
        <span className="text-xs text-[#6B7A90]">Tap a module to open resources</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {modules.map((mod, i) => {
          const Icon = ICONS[mod.id as keyof typeof ICONS] ?? Sparkles;
          const href = examFocusResourcesHref(mod.id, profile);
          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.04 }}
            >
              <Link
                href={href}
                className="dash-glass-card group block rounded-2xl p-4 transition-colors hover:border-[#8B5CF6]/25"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8B5CF6]/15 text-[#C4B5FD]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-[#F8FAFC]">{mod.title}</p>
                      <span className="shrink-0 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-[#A78BFA]">
                        {mod.tag}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[#94A3B8]">{mod.description}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
