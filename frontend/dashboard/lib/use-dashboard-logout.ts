"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { destroySession } from "@/lib/profile/client";
import { useMissionAnalyticsStore } from "@/store/mission-analytics-store";
import { useProfileStore } from "@/store/profile-store";

export function useDashboardLogout() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = useCallback(async () => {
    setLoggingOut(true);
    useProfileStore.getState().clearProfile();
    useMissionAnalyticsStore.getState().clear();
    try {
      await destroySession();
      router.replace("/");
    } catch {
      setLoggingOut(false);
    }
  }, [router]);

  return { logout, loggingOut };
}
