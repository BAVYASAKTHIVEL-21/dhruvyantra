"use client";

import { useCallback, useEffect, useState } from "react";
import type { FocusAnalyticsSnapshot } from "@/types/focus";
import { emptyFocusAnalytics } from "@/lib/focus/analytics";
import { FOCUS_STREAK_REFRESH_EVENT } from "@/services/focus/focus-history-service";
import {
  computeLocalFocusAnalytics,
  fetchFocusAnalytics,
} from "@/services/focus/focus-analytics-service";

export function useFocusAnalytics() {
  const [analytics, setAnalytics] = useState<FocusAnalyticsSnapshot>(() =>
    typeof window !== "undefined" ? computeLocalFocusAnalytics() : emptyFocusAnalytics(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFocusAnalytics();
      setAnalytics(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
      setAnalytics(computeLocalFocusAnalytics());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onRefresh = () => {
      void refresh();
    };
    window.addEventListener(FOCUS_STREAK_REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(FOCUS_STREAK_REFRESH_EVENT, onRefresh);
  }, [refresh]);

  return { analytics, loading, error, refresh };
}
