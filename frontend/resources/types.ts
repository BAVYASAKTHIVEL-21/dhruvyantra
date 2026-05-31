export type {
  Recommendation,
  RecommendationLabel,
  Resource,
  ResourceDifficulty,
  ResourceFilter,
  ResourceSource,
  ResourceSubject,
  ResourceType,
  ResourcesApiResponse,
} from "@/types/resource";

export type SubjectSummary = {
  id: string;
  name: import("@/types/resource").ResourceSubject;
  resourceCount: number;
  icon: "physics" | "chemistry" | "math" | "biology" | "other";
};

export type RecentFile = {
  id: string;
  title: string;
  type: import("@/types/resource").ResourceType;
  openedAt: string;
  resourceId: string;
};

export type QuickAccessItem = {
  id: string;
  label: string;
  icon: string;
  filterTag: string;
};

export type StorageUsage = {
  usedGb: number;
  totalGb: number;
};
