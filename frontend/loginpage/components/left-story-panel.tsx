"use client";

import { motion } from "framer-motion";
import { DhruvYantraLogo } from "../../shared/components/logo";
import { CinematicGlow } from "./cinematic-glow";
import { StudyHeroImage } from "./study-hero-image";
import { SubtleStars } from "./subtle-stars";

export function LeftStoryPanel() {
  return (
    <div className="relative flex min-h-[420px] w-full flex-col overflow-hidden lg:min-h-screen lg:min-w-0 lg:flex-1 lg:basis-[60%]">
      <SubtleStars />
      <CinematicGlow />

      <div className="pointer-events-none absolute inset-0 z-[1]">
        <div className="absolute -left-16 top-[20%] h-80 w-80 rounded-full bg-[#8B5CF6]/12 blur-[110px]" />
        <div className="absolute bottom-[30%] left-[20%] h-64 w-64 rounded-full bg-[#F59E0B]/10 blur-[100px]" />
        <div className="absolute right-[8%] top-[15%] h-40 w-40 rounded-full bg-[#38BDF8]/8 blur-[80px]" />
      </div>

      <StudyHeroImage />

      {/* Light top-left scrim for logo readability */}
      <div
        className="pointer-events-none absolute inset-0 z-[3] bg-[radial-gradient(ellipse_70%_50%_at_0%_0%,rgba(11,16,32,0.55)_0%,transparent_45%)]"
        aria-hidden
      />

      {/* Content: logo (top-left) */}
      <div className="relative z-10 flex min-h-full flex-1 flex-col">
        <header className="shrink-0 px-6 pt-7 md:px-10 md:pt-8 lg:px-12 lg:pt-9">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <DhruvYantraLogo large />
          </motion.div>
        </header>
      </div>
    </div>
  );
}
