"use client";

import { motion } from "framer-motion";
import { Target } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useProfile } from "@/hooks/useProfile";
import { AmbientSoundCard } from "./ambient-sound-card";
import { FocusHeroCard, type FocusSessionDetails } from "./focus-hero-card";
import { FocusQueueCard } from "./focus-queue-card";
import { FocusStatsCard } from "./focus-stats-card";
import { FocusStreakCard } from "./focus-streak-card";
import { MotivationBanner } from "./motivation-banner";

function productiveStartLabel(time: string | null | undefined): string {
  if (time === "Morning") return "6:30 AM";
  if (time === "Night") return "9:00 PM";
  if (time === "Evening") return "7:00 PM";
  return "Now";
}

export function DeepFocusPage() {
  const searchParams = useSearchParams();
  const { profile } = useProfile();

  const session = useMemo((): FocusSessionDetails => {
    const topic = searchParams.get("topic") ?? profile?.weakTopics[0] ?? "Weak topic focus";
    const subject = searchParams.get("subject") ?? profile?.weakSubjects[0] ?? "General";
    const durationMin = Number(searchParams.get("duration") ?? 45);
    const productiveTime = searchParams.get("time") ?? profile?.productiveTime ?? null;
    const hours = Math.floor(durationMin / 60);
    const mins = durationMin % 60;
    const estimated = hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ""}`.trim() : `${mins}m`;

    return {
      topic,
      subject,
      subjectLine: `${subject} — ${topic}`,
      priority: "High Priority",
      target:
        profile?.examType === "JEE"
          ? `Timed numericals + PYQs on ${topic}`
          : `NCERT revision + recall on ${topic}`,
      estimated,
      startTime: productiveStartLabel(productiveTime),
      durationSeconds: durationMin * 60,
    };
  }, [searchParams, profile]);

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2">
          <Target className="h-7 w-7 text-[#8B5CF6]" />
          <h1 className="font-heading text-3xl font-bold tracking-tight text-[#F8FAFC] md:text-4xl">
            Deep Focus
          </h1>
        </div>
        <p className="mt-1 text-sm text-[#94A3B8]">
          Session prefilled from Mission Control · {session.subjectLine}
        </p>
      </motion.header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <FocusHeroCard
            key={`${session.topic}-${session.subject}`}
            mode="focus"
            session={session}
          />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <FocusQueueCard />
            <AmbientSoundCard />
          </div>
          <MotivationBanner />
        </div>

        <aside className="space-y-6">
          <FocusStatsCard />
          <FocusStreakCard />
        </aside>
      </div>
    </>
  );
}
