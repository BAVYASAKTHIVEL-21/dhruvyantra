"use client";

import { ChevronRight, FolderOpen } from "lucide-react";
import { motion } from "framer-motion";
import { useProfile } from "@/hooks/useProfile";
import { resourcesHeroCopy } from "@/lib/personalization/dashboard";

export function ResourcesHero() {
  const { profile, loading } = useProfile();
  const copy = resourcesHeroCopy(profile);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="resources-hero relative overflow-hidden rounded-2xl border border-[#8B5CF6]/20 p-6 md:p-8"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[#8B5CF6]/20 blur-3xl" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[#A78BFA]">
            {loading && !profile ? (
              <span className="inline-block h-3 w-32 animate-pulse rounded bg-white/[0.06]" />
            ) : (
              copy.eyebrow
            )}
          </p>
          <h2 className="font-heading mt-1 text-2xl font-bold text-[#F8FAFC] md:text-3xl">
            {loading && !profile ? (
              <span className="inline-block h-8 w-64 animate-pulse rounded bg-white/[0.06]" />
            ) : (
              copy.title
            )}
          </h2>
          <p className="mt-2 max-w-md text-sm text-[#94A3B8]">{copy.subtitle}</p>
          <button
            type="button"
            className="btn-gradient-glow mt-4 flex cursor-pointer items-center gap-1 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
          >
            Explore Now
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex shrink-0 items-center justify-center">
          <motion.div className="relative flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8B5CF6]/30 to-[#EC4899]/20 ring-1 ring-[#8B5CF6]/40 md:h-28 md:w-28">
            <FolderOpen className="h-12 w-12 text-[#C4B5FD] md:h-14 md:w-14" />
            <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#38BDF8]/20 ring-1 ring-[#38BDF8]/30">
              <span className="text-lg">{profile?.examType === "NEET" ? "🧬" : "⚡"}</span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
