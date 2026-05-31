import { getMockTopicPerformances } from "@/lib/mock-center/store";
import type { MockTopicPerformance } from "@/types/mock-results";
import type { UserProfile } from "@/lib/profile/types";
import { WEAKNESS_DEFAULT_WINDOW_DAYS } from "./constants";

/** Mock submissions feed into computeWeaknessEngine via mockPerformances. */
export async function loadMockPerformancesForProfile(
  profile: UserProfile,
  windowDays: number = WEAKNESS_DEFAULT_WINDOW_DAYS,
): Promise<MockTopicPerformance[]> {
  return getMockTopicPerformances(profile.userId, windowDays);
}
