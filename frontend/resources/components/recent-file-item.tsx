"use client";

import { FileText, Film, BookOpen } from "lucide-react";
import type { RecentFile } from "../types";

const TYPE_ICONS = {
  Notes: FileText,
  Books: BookOpen,
  PYQs: FileText,
  DPPs: FileText,
  Videos: Film,
  Others: FileText,
};

export function RecentFileItem({ file }: { file: RecentFile }) {
  const Icon = TYPE_ICONS[file.type] ?? FileText;
  return (
    <button
      type="button"
      className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white/[0.04]"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#8B5CF6]/15">
        <Icon className="h-4 w-4 text-[#A78BFA]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-[#E2E8F0]">{file.title}</p>
        <p className="text-[11px] text-[#6B7A90]">{file.openedAt}</p>
      </div>
    </button>
  );
}
