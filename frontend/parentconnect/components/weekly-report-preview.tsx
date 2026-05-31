"use client";

import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import type { ParentWeeklyReport } from "@/types/parent-connect";
import { WEEKLY_REPORT } from "../data";

type Props = {
  report?: ParentWeeklyReport;
};

export function WeeklyReportPreview({ report }: Props) {
  const data = report ?? WEEKLY_REPORT;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="parent-report-preview rounded-2xl border border-white/[0.08] p-5 md:p-6"
    >
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-[#8B5CF6]" />
        <h3 className="font-heading text-base font-bold text-[#F8FAFC]">Weekly Report Preview</h3>
      </div>
      <p className="mt-1 text-xs text-[#6B7A90]">{data.week}</p>

      <div className="mt-4 space-y-3 rounded-xl border border-dashed border-white/[0.1] bg-white/[0.02] p-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#6B7A90]">Summary</p>
          <p className="mt-1 text-sm text-[#E2E8F0]">{data.summary}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-[#6B7A90]">Focus hours</p>
            <p className="font-semibold text-[#F8FAFC]">{data.focusHours}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#6B7A90]">Weak topics</p>
            <p className="text-sm text-[#F87171]">{data.weakTopics.join(", ")}</p>
          </div>
        </div>
        <div className="border-t border-white/[0.06] pt-3">
          <p className="text-[10px] font-medium text-[#8B5CF6]">AI recommendation</p>
          <p className="mt-1 text-xs leading-relaxed text-[#94A3B8]">{data.aiRecommendation}</p>
        </div>
      </div>
    </motion.div>
  );
}
