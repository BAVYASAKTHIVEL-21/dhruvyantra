"use client";

import { FileImage, FileText, MoreVertical } from "lucide-react";
import type { VaultFile } from "../types";

const SUBJECT_COLORS: Record<string, string> = {
  Physics: "bg-[#8B5CF6]/20 text-[#C4B5FD] ring-[#8B5CF6]/30",
  Chemistry: "bg-[#22C55E]/15 text-[#86EFAC] ring-[#22C55E]/25",
  Mathematics: "bg-[#38BDF8]/15 text-[#7DD3FC] ring-[#38BDF8]/25",
  Biology: "bg-[#EC4899]/15 text-[#F9A8D4] ring-[#EC4899]/25",
  Mixed: "bg-white/10 text-[#94A3B8] ring-white/20",
};

type Props = {
  files: VaultFile[];
  loading?: boolean;
};

function FileCard({ file }: { file: VaultFile }) {
  return (
    <div className="dash-glass-card group flex cursor-pointer gap-3 rounded-xl p-4 transition-transform hover:-translate-y-0.5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#EF4444]/15">
        {file.type === "image" ? (
          <FileImage className="h-6 w-6 text-[#F87171]" />
        ) : (
          <FileText className="h-6 w-6 text-[#F87171]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[#F8FAFC]">{file.name}</p>
        <span
          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${SUBJECT_COLORS[file.subject] ?? SUBJECT_COLORS.Mixed}`}
        >
          {file.subject}
        </span>
        <p className="mt-1 text-[10px] text-[#6B7A90]">
          {file.size} · {file.openedAt}
        </p>
      </div>
      <button
        type="button"
        className="shrink-0 text-[#6B7A90] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[#F8FAFC]"
        aria-label="Options"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
    </div>
  );
}

export function RecentFilesSection({ files, loading }: Props) {
  return (
    <section>
      <h3 className="font-heading text-base font-bold text-[#F8FAFC]">Recent Files</h3>
      {loading ? (
        <p className="mt-4 text-sm text-[#6B7A90]">Loading from Google Drive…</p>
      ) : files.length === 0 ? (
        <p className="mt-4 text-sm text-[#6B7A90]">No files in your Vault folder yet.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {files.map((file) =>
            file.url ? (
              <a
                key={file.id}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <FileCard file={file} />
              </a>
            ) : (
              <FileCard key={file.id} file={file} />
            ),
          )}
        </div>
      )}
    </section>
  );
}
