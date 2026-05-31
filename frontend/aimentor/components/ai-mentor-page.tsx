"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import type { MentorTab } from "../data";
import { ChatWorkspace } from "./chat-workspace";
import { MentorInsightsPanel } from "./mentor-insights-panel";
import { MentorModeTabs } from "./mentor-mode-tabs";

export function AiMentorPage() {
  const [activeTab, setActiveTab] = useState<MentorTab>("study");

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
      >
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-[#8B5CF6]" />
            <h1 className="font-heading text-3xl font-bold tracking-tight text-[#F8FAFC] md:text-4xl">
              AI Mentor
            </h1>
          </div>
          <p className="mt-1 max-w-xl text-sm text-[#94A3B8]">
            Your intelligent study companion. I&apos;m here to guide, support and help you grow.
          </p>
        </div>
        <MentorModeTabs active={activeTab} onChange={setActiveTab} />
      </motion.header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
        <ChatWorkspace mode={activeTab} />
        <MentorInsightsPanel />
      </div>
    </>
  );
}
