"use client";

import {
  BookOpen,
  Code2,
  FileText,
  GraduationCap,
  MessageSquare,
  Share2,
  UserPlus,
  Users,
} from "lucide-react";
import {
  getCollaborationImpact,
  getCommunities,
  getRecentActivity,
  getUpcomingSessions,
} from "../services/connectionsService";

const COMMUNITY_ICONS = {
  jee: GraduationCap,
  neet: BookOpen,
  board: FileText,
  code: Code2,
};

const ACTIVITY_ICONS = {
  join: UserPlus,
  share: Share2,
  solve: MessageSquare,
  post: Users,
};

export function ConnectionsSidebar() {
  const impact = getCollaborationImpact();
  const maxSpark = Math.max(...impact.sparkline);

  return (
    <aside className="space-y-4">
      <div className="dash-glass-card rounded-2xl p-5">
        <h3 className="font-heading text-sm font-bold text-[#F8FAFC]">Active Communities</h3>
        <ul className="mt-3 space-y-2">
          {getCommunities().map((c) => {
            const Icon = COMMUNITY_ICONS[c.icon];
            return (
              <li
                key={c.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.06] p-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#8B5CF6]/15">
                    <Icon className="h-4 w-4 text-[#A78BFA]" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm text-[#E2E8F0]">{c.name}</p>
                    <p className="text-[10px] text-[#6B7A90]">{c.members} members</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="shrink-0 cursor-pointer rounded-lg bg-[#8B5CF6]/20 px-2.5 py-1 text-[10px] font-semibold text-[#C4B5FD] hover:bg-[#8B5CF6]/30"
                >
                  Join
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="dash-glass-card rounded-2xl p-5">
        <h3 className="font-heading text-sm font-bold text-[#F8FAFC]">Upcoming Sessions</h3>
        <ul className="mt-3 space-y-3">
          {getUpcomingSessions().map((session) => (
            <li
              key={session.id}
              className="rounded-xl border border-white/[0.06] p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-[#F8FAFC]">{session.title}</p>
                {session.live ? (
                  <span className="shrink-0 rounded-full bg-[#EF4444]/20 px-2 py-0.5 text-[9px] font-bold text-[#F87171] ring-1 ring-[#EF4444]/30">
                    LIVE
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-[11px] text-[#6B7A90]">{session.mentor}</p>
              <p className="text-[10px] text-[#8B5CF6]">{session.when}</p>
              <button
                type="button"
                className="mt-2 w-full cursor-pointer rounded-lg border border-[#8B5CF6]/25 py-1.5 text-[11px] font-semibold text-[#C4B5FD] hover:bg-[#8B5CF6]/10"
              >
                Join
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="dash-glass-card rounded-2xl p-5">
        <h3 className="font-heading text-sm font-bold text-[#F8FAFC]">Recent Activity</h3>
        <ul className="mt-3 space-y-3">
          {getRecentActivity().map((item) => {
            const Icon = ACTIVITY_ICONS[item.type];
            return (
              <li key={item.id} className="flex gap-2 text-xs">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#8B5CF6]/15">
                  <Icon className="h-3.5 w-3.5 text-[#A78BFA]" />
                </div>
                <div>
                  <p className="text-[#E2E8F0]">{item.text}</p>
                  <p className="text-[10px] text-[#6B7A90]">{item.time}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="dash-glass-card rounded-2xl p-5">
        <h3 className="font-heading text-sm font-bold text-[#F8FAFC]">
          Your Collaboration Impact
        </h3>
        <p className="font-heading mt-2 text-2xl font-bold text-[#F8FAFC]">
          {impact.points} Points
        </p>
        <p className="text-xs text-[#34D399]">{impact.trend}</p>
        <div className="mt-3 flex h-12 items-end gap-1">
          {impact.sparkline.map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-gradient-to-t from-[#8B5CF6]/40 to-[#8B5CF6]"
              style={{ height: `${(v / maxSpark) * 100}%`, minHeight: 4 }}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
