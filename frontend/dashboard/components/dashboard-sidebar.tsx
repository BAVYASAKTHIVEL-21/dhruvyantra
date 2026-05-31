"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useMissionAnalytics } from "@/hooks/useMissionAnalytics";
import { useProfile } from "@/hooks/useProfile";
import { DhruvYantraLogo } from "../../shared/components/logo";
import { getDashboardHref, isDashboardNavActive } from "../navigation";
import { SIDEBAR_NAV } from "../data";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { profile } = useProfile();
  const { alertCount } = useMissionAnalytics();

  const name = profile?.name ?? "Student";
  const role = profile?.role ?? "Aspirant";
  const initial = name.charAt(0).toUpperCase();

  const navItems = useMemo(
    () =>
      SIDEBAR_NAV.map((item) =>
        item.id === "alerts" && alertCount > 0
          ? { ...item, badge: alertCount }
          : item,
      ),
    [alertCount],
  );

  return (
    <aside className="dash-sidebar pointer-events-auto fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col overflow-hidden border-r border-white/[0.06] px-4 py-6 lg:w-[272px]">
      <Link
        href="/dashboard"
        className="w-full min-w-0 shrink-0 cursor-pointer overflow-hidden pr-0.5"
      >
        <DhruvYantraLogo sidebar />
      </Link>

      <nav className="mt-8 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-0.5">
        {navItems.map((item, i) => {
          const Icon = item.icon;
          const href = getDashboardHref(item.id);
          const isActive = isDashboardNavActive(pathname, item.id);

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 + i * 0.03, duration: 0.35 }}
            >
              <Link
                href={href}
                className={`group relative z-10 flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "dash-nav-active font-medium text-[#F8FAFC]"
                    : "text-[#94A3B8] hover:bg-white/[0.06] hover:text-[#E2E8F0]"
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] shrink-0 ${
                    isActive ? "text-[#C4B5FD]" : "text-[#6B7A90] group-hover:text-[#A8B4C4]"
                  }`}
                  strokeWidth={1.75}
                />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <span className="ml-1 flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-[#8B5CF6] px-1.5 text-[10px] font-semibold text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.45 }}
        className="dash-profile-card relative z-10 mt-4 rounded-2xl p-3.5"
      >
        <div className="flex w-full items-center gap-3 text-left">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#38BDF8] text-sm font-bold text-white ring-2 ring-white/10">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="truncate text-sm font-semibold text-[#F8FAFC]">{name}</span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#6B7A90]" />
            </div>
            <p className="text-xs text-[#94A3B8]">{role}</p>
          </div>
        </div>
      </motion.div>
    </aside>
  );
}
