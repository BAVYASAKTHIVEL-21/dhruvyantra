"use client";

import { useCallback, useEffect } from "react";
import { MOCK_CENTER_REFRESH_EVENT } from "@/lib/mock-center/events";
import { useMissionAnalyticsStore } from "@/store/mission-analytics-store";
import { useProfileStore } from "@/store/profile-store";

export function useMissionAnalytics() {
  const profile = useProfileStore((s) => s.profile);
  const analytics = useMissionAnalyticsStore((s) => s.analytics);
  const loading = useMissionAnalyticsStore((s) => s.loading);
  const error = useMissionAnalyticsStore((s) => s.error);
  const refreshStore = useMissionAnalyticsStore((s) => s.refresh);

  useEffect(() => {
    if (profile && !analytics && !loading) {
      void refreshStore();
    }
  }, [profile, analytics, loading, refreshStore]);

  useEffect(() => {
    const onMockSubmitted = () => {
      if (useProfileStore.getState().profile) {
        void refreshStore();
      }
    };
    window.addEventListener(MOCK_CENTER_REFRESH_EVENT, onMockSubmitted);
    return () => window.removeEventListener(MOCK_CENTER_REFRESH_EVENT, onMockSubmitted);
  }, [refreshStore]);

  const refresh = useCallback(async () => {
    return refreshStore();
  }, [refreshStore]);

  return {
    analytics,
    loading,
    error,
    refresh,
    alertCount: analytics?.alertCount ?? 0,
  };
}
