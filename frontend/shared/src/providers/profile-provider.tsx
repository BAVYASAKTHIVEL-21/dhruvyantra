"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useProfileStore } from "@/store/profile-store";
import { useMissionAnalyticsStore } from "@/store/mission-analytics-store";

/** Loads profile + mission analytics into global stores on mount. */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const refreshProfile = useProfileStore((s) => s.refreshProfile);
  const refreshAnalytics = useMissionAnalyticsStore((s) => s.refresh);
  const hydrated = useProfileStore((s) => s.hydrated);
  const profile = useProfileStore((s) => s.profile);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    if (hydrated && profile) {
      void refreshAnalytics();
    }
  }, [hydrated, profile, refreshAnalytics]);

  return <>{children}</>;
}
