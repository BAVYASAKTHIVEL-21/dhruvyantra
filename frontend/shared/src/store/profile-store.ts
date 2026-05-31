"use client";

import { create } from "./create";
import type { ProfileMe } from "@/lib/profile/me-types";
import {
  fetchProfileMe,
  getCachedProfileMe,
  updateProfileMe,
} from "@/services/profile-service";
import type { UserProfile } from "@/lib/profile/types";
import { cacheProfileLocally } from "@/lib/profile/client";

type ProfileState = {
  profile: ProfileMe | null;
  loading: boolean;
  error: string | null;
  hydrated: boolean;
  setProfile: (profile: ProfileMe | null) => void;
  refreshProfile: () => Promise<ProfileMe | null>;
  updateProfile: (
    patch: Partial<UserProfile> & { onboardingCompleted?: boolean },
  ) => Promise<ProfileMe | null>;
  clearProfile: () => void;
};

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loading: false,
  error: null,
  hydrated: false,

  setProfile: (profile) => set({ profile, error: null }),

  refreshProfile: async () => {
    set({ loading: true, error: null });
    try {
      const cached = getCachedProfileMe();
      if (cached && !get().profile) {
        set({ profile: cached });
      }

      const profile = await fetchProfileMe();
      cacheProfileLocally(profile);
      set({ profile, loading: false, hydrated: true, error: null });
      return profile;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to load profile";
      const cached = getCachedProfileMe();
      set({
        profile: cached ?? get().profile,
        loading: false,
        hydrated: true,
        error: cached ? null : message,
      });
      return cached ?? null;
    }
  },

  updateProfile: async (patch) => {
    set({ loading: true, error: null });
    try {
      const profile = await updateProfileMe(patch);
      set({ profile, loading: false, error: null });
      return profile;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to update profile";
      set({ loading: false, error: message });
      return null;
    }
  },

  clearProfile: () =>
    set({ profile: null, loading: false, error: null, hydrated: false }),
}));
