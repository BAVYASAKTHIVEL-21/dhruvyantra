"use client";

import { useCallback, useEffect, useState } from "react";
import { emptyMentorInsights, type MentorInsightsSnapshot } from "@/lib/mentor/insights";
import { MOCK_CENTER_REFRESH_EVENT } from "@/lib/mock-center/events";
import { FOCUS_STREAK_REFRESH_EVENT } from "@/services/focus/focus-history-service";
import { fetchMentorInsights } from "@/services/mentor/mentor-insights-service";

export function useMentorInsights() {
  const [insights, setInsights] = useState<MentorInsightsSnapshot>(emptyMentorInsights);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMentorInsights();
      setInsights(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load mentor insights");
      setInsights(emptyMentorInsights());
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
    window.addEventListener(MOCK_CENTER_REFRESH_EVENT, onRefresh);
    return () => {
      window.removeEventListener(FOCUS_STREAK_REFRESH_EVENT, onRefresh);
      window.removeEventListener(MOCK_CENTER_REFRESH_EVENT, onRefresh);
    };
  }, [refresh]);

  return { insights, loading, error, refresh };
}
