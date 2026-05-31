"use client";

import {
  Download,
  FileText,
  FolderInput,
  Share2,
  Sparkles,
  Star,
  TrendingUp,
  Upload,
} from "lucide-react";
import {
  getAiOrganization,
  getQuickAccess,
  getRecentActivity,
  getStorage,
  getStorageBreakdown,
} from "../services/vaultService";
import { AiAvatar } from "../../aimentor/components/ai-avatar";

const ACCESS_ICONS = {
  trending: TrendingUp,
  star: Star,
  download: Download,
  share: Share2,
};

const ACTIVITY_ICONS = {
  open: FileText,
  upload: Upload,
  ai: Sparkles,
  move: FolderInput,
};

export function VaultSidebarPanel() {
  const storage = getStorage();
  const pct = Math.round((storage.usedGb / storage.totalGb) * 100);
  const breakdown = getStorageBreakdown();
  const activity = getRecentActivity();
  const aiOrg = getAiOrganization();

  return (
    <aside className="space-y-4">
      <div className="dash-glass-card rounded-2xl p-5">
        <h3 className="font-heading text-sm font-bold text-[#F8FAFC]">Storage Overview</h3>
        <div className="mt-4 flex items-center gap-4">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
            <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
              <circle
                cx="40"
                cy="40"
                r="32"
                fill="none"
                stroke="url(#vaultStorageGrad)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 32}
                strokeDashoffset={2 * Math.PI * 32 * (1 - pct / 100)}
              />
              <defs>
                <linearGradient id="vaultStorageGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#38BDF8" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute text-xs font-bold text-[#F8FAFC]">{pct}%</span>
          </div>
          <div>
            <p className="font-heading text-lg font-bold text-[#F8FAFC]">
              {storage.usedGb} GB
            </p>
            <p className="text-xs text-[#6B7A90]">/ {storage.totalGb} GB</p>
          </div>
        </div>
        <ul className="mt-4 space-y-2">
          {breakdown.map((item) => (
            <li key={item.label} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-[#94A3B8]">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.label}
              </span>
              <span className="text-[#E2E8F0]">{item.gb} GB</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="dash-glass-card rounded-2xl p-5">
        <h3 className="font-heading text-sm font-bold text-[#F8FAFC]">Quick Access</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {getQuickAccess().map((item) => {
            const Icon = ACCESS_ICONS[item.icon];
            return (
              <button
                key={item.id}
                type="button"
                className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-center transition-colors hover:border-[#8B5CF6]/25"
              >
                <Icon className="h-4 w-4 text-[#A78BFA]" />
                <span className="text-[10px] font-medium text-[#94A3B8]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="dash-glass-card rounded-2xl p-5">
        <h3 className="font-heading text-sm font-bold text-[#F8FAFC]">Recent Activity</h3>
        <ul className="mt-3 space-y-3">
          {activity.map((item) => {
            const Icon = ACTIVITY_ICONS[item.type];
            return (
              <li key={item.id} className="flex gap-2 text-xs">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#8B5CF6]/15">
                  <Icon className="h-3.5 w-3.5 text-[#A78BFA]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[#E2E8F0]">{item.action}</p>
                  <p className="text-[10px] text-[#6B7A90]">{item.time}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="dash-glass-card relative overflow-hidden rounded-2xl border-[#8B5CF6]/15 p-5">
        <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-[#8B5CF6]/20 blur-2xl" />
        <div className="relative flex gap-3">
          <AiAvatar size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#8B5CF6]">AI Organization</p>
            <p className="mt-2 text-xs leading-relaxed text-[#94A3B8]">{aiOrg.message}</p>
            <button
              type="button"
              className="btn-gradient-glow mt-3 w-full cursor-pointer rounded-lg py-2 text-xs font-semibold text-white"
            >
              Review Suggestions
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
