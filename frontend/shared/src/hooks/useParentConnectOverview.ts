"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchParentConnectOverview } from "@/services/parent-connect-service";
import type { ParentConnectOverview } from "@/types/parent-connect";

export function useParentConnectOverview() {
  const [overview, setOverview] = useState<ParentConnectOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchParentConnectOverview();
      setOverview(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load overview");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { overview, loading, error, refresh };
}
