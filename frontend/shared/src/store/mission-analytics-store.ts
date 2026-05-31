"use client";

import { create } from "@/store/create";
import { fetchMissionAnalytics } from "@/services/mission-control-service";
import type { MissionControlAnalytics } from "@/types/mission-control";
import { useProfileStore } from "@/store/profile-store";

type MissionAnalyticsState = {
  analytics: MissionControlAnalytics | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<MissionControlAnalytics | null>;
  clear: () => void;
};

let refreshInFlight: Promise<MissionControlAnalytics | null> | null = null;

export const useMissionAnalyticsStore = create<MissionAnalyticsState>((set) => ({
  analytics: null,
  loading: false,
  error: null,

  clear: () => {
    refreshInFlight = null;
    set({ analytics: null, loading: false, error: null });
  },

  refresh: async () => {
    if (!useProfileStore.getState().profile) {
      return null;
    }

    if (refreshInFlight) {
      return refreshInFlight;
    }

    refreshInFlight = (async () => {
      set({ loading: true, error: null });
      try {
        const analytics = await fetchMissionAnalytics();
        if (!useProfileStore.getState().profile) {
          set({ loading: false });
          return null;
        }
        set({ analytics, loading: false, error: null });
        return analytics;
      } catch (e) {
        const unauthorized = e instanceof Error && e.message === "Unauthorized";
        set({
          loading: false,
          error: unauthorized
            ? null
            : e instanceof Error
              ? e.message
              : "Failed to load analytics",
        });
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();

    return refreshInFlight;
  },
}));
