"use client";

import type { ReactNode } from "react";
import { OnboardingGate } from "./onboarding-gate";
import { DashboardSidebar } from "./dashboard-sidebar";
import { ProfileProvider } from "@/providers/profile-provider";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <OnboardingGate>
      <ProfileProvider>
        <div className="dashboard-bg min-h-screen">
          <div className="pointer-events-none fixed inset-0 overflow-hidden">
            <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-[#8B5CF6]/8 blur-[120px]" />
            <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-[#38BDF8]/6 blur-[100px]" />
            <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[#EC4899]/5 blur-[90px]" />
          </div>

          <DashboardSidebar />

          <main className="relative z-10 min-h-screen pl-[260px] xl:pl-[272px]">
            <div className="pointer-events-auto mx-auto w-full max-w-[1440px] px-5 py-6 md:px-7 md:py-8 lg:px-9">
              {children}
            </div>
          </main>
        </div>
      </ProfileProvider>
    </OnboardingGate>
  );
}
