import type { ExamType } from "@/config/exam-config";

export type { ExamType };

export type ProductiveTime = "Morning" | "Evening" | "Night";

export type ParentChannel = "telegram" | null;

export type UserProfile = {
  userId: string;
  email?: string;
  examType: ExamType | null;
  targetYear: number | null;
  weakSubjects: string[];
  weakTopics: string[];
  dailyStudyHours: number;
  productiveTime: ProductiveTime | null;
  parentContact: {
    channel: ParentChannel;
    value: string;
  } | null;
  onboardingCompleted: boolean;
  updatedAt?: string;
};

export type OnboardingDraft = Omit<UserProfile, "userId" | "onboardingCompleted" | "updatedAt">;

export const DEFAULT_PROFILE: UserProfile = {
  userId: "",
  examType: null,
  targetYear: null,
  weakSubjects: [],
  weakTopics: [],
  dailyStudyHours: 6,
  productiveTime: null,
  parentContact: null,
  onboardingCompleted: false,
};
