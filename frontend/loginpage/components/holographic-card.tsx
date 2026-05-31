"use client";

import { motion, type TargetAndTransition, type Transition } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type HolographicCardProps = {
  className?: string;
  glow?: "purple" | "blue" | "warm";
  float?: boolean;
  children?: ReactNode;
  initial?: TargetAndTransition;
  animate?: TargetAndTransition;
  transition?: Transition;
};

const glowStyles = {
  purple: "shadow-[0_0_30px_rgba(139,92,246,0.25),inset_0_0_20px_rgba(139,92,246,0.06)]",
  blue: "shadow-[0_0_30px_rgba(56,189,248,0.2),inset_0_0_20px_rgba(56,189,248,0.05)]",
  warm: "shadow-[0_0_30px_rgba(245,158,11,0.2),inset_0_0_20px_rgba(245,158,11,0.05)]",
};

const floatAnimate: TargetAndTransition = {
  y: [0, -6, 0],
  opacity: [0.92, 1, 0.92],
};

const floatTransition: Transition = {
  duration: 6,
  repeat: Infinity,
  ease: "easeInOut",
};

export function HolographicCard({
  className,
  glow = "purple",
  float = true,
  children,
  initial,
  animate: animateProp,
  transition: transitionProp,
}: HolographicCardProps) {
  return (
    <motion.div
      className={cn(
        "rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl",
        glowStyles[glow],
        className
      )}
      initial={initial}
      animate={animateProp ?? (float ? floatAnimate : undefined)}
      transition={transitionProp ?? (float && !animateProp ? floatTransition : undefined)}
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#8B5CF6]/5 via-transparent to-[#38BDF8]/5" />
      <div className="relative">{children}</div>
    </motion.div>
  );
}
