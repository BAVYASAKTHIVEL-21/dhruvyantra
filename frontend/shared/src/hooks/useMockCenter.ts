"use client";

import { useCallback, useEffect, useState } from "react";
import type { MockCenterOverview } from "@/types/mock-center";
import { emptyMockOverview } from "@/types/mock-center";
import { MOCK_CENTER_REFRESH_EVENT } from "@/lib/mock-center/events";
import { fetchMockCenterOverview } from "@/services/mock-center/mock-center-service";
import { buildMockTypes } from "@/services/mock-center/mock-overview";
import { useProfile } from "@/hooks/useProfile";

export function useMockCenter() {
  const { profile } = useProfile();
  const [overview, setOverview] = useState<MockCenterOverview>(() =>
    emptyMockOverview(profile ?? undefined),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMockCenterOverview();
      setOverview(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load mock center");
      setOverview(emptyMockOverview(profile ?? undefined));
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onRefresh = () => {
      void refresh();
    };
    window.addEventListener(MOCK_CENTER_REFRESH_EVENT, onRefresh);
    return () => window.removeEventListener(MOCK_CENTER_REFRESH_EVENT, onRefresh);
  }, [refresh]);

  useEffect(() => {
    if (!profile) return;
    setOverview((prev) => ({
      ...prev,
      examType: profile.examType,
      mockTypes: buildMockTypes(profile),
    }));
  }, [profile]);

  return { overview, loading, error, refresh };
}
