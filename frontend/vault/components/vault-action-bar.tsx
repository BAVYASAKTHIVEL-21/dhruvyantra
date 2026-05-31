"use client";

import { useRef } from "react";
import {
  FolderPlus,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";

const ACTIONS = [
  { id: "upload", label: "Upload Notes", icon: Upload, primary: true },
  { id: "folder", label: "Create Folder", icon: FolderPlus, primary: false },
  { id: "ai", label: "AI Summary", icon: Sparkles, primary: false },
  { id: "revision", label: "Quick Revision", icon: Zap, primary: false },
] as const;

type Props = {
  onUpload?: (file: File) => void;
  uploading?: boolean;
  driveConfigured?: boolean;
  setupHint?: string | null;
};

export function VaultActionBar({ onUpload, uploading, driveConfigured, setupHint }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-wrap gap-2">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && onUpload) onUpload(file);
          e.target.value = "";
        }}
      />
      {ACTIONS.map((action) => {
        const Icon = action.icon;
        const isUpload = action.id === "upload";
        return (
          <button
            key={action.id}
            type="button"
            disabled={isUpload && (uploading || !driveConfigured)}
            title={
              isUpload && !driveConfigured
                ? setupHint ?? "Configure Google Drive in .env.local"
                : undefined
            }
            onClick={() => {
              if (isUpload) inputRef.current?.click();
            }}
            className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
              action.primary
                ? "btn-gradient-glow text-white"
                : "border border-white/[0.08] bg-white/[0.04] text-[#E2E8F0] hover:border-[#8B5CF6]/25 hover:shadow-[0_0_20px_rgba(139,92,246,0.12)]"
            }`}
          >
            <Icon className="h-4 w-4" />
            {isUpload && uploading ? "Uploading…" : action.label}
          </button>
        );
      })}
    </div>
  );
}
