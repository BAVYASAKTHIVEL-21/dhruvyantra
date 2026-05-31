export type ResourceType =
  | "Notes"
  | "Books"
  | "PYQs"
  | "DPPs"
  | "Videos"
  | "Others";

export type ResourceSubject =
  | "Physics"
  | "Chemistry"
  | "Mathematics"
  | "Biology"
  | "Others";

export type ResourceDifficulty = "Easy" | "Medium" | "Hard";

export type ResourceSource = "local" | "drive" | "notion";

/** Canonical resource shape — Notion-backed with UI compatibility fields */
export type Resource = {
  id: string;
  title: string;
  subject: ResourceSubject;
  topic: string;
  type: ResourceType;
  difficulty: ResourceDifficulty;
  tags: string[];
  driveUrl?: string;
  recommended: boolean;
  /** Gradient key for ResourceThumbnail — derived when no image URL */
  thumbnail: string;
  thumbnailUrl?: string;
  duration?: string;
  fileSize?: string;
  /** UI compatibility — derived at fetch time */
  rating: number;
  reviewCount: number;
  featured: boolean;
  weakTopicRelated: boolean;
  source: ResourceSource;
  classLabel?: string;
};

export type ResourceFilter = "All" | ResourceType;

export type RecommendationLabel =
  | "Suggested for You"
  | "Weak Topic"
  | "Exam Booster"
  | "NCERT Focus";

export type Recommendation = {
  id: string;
  resourceId: string;
  label: RecommendationLabel;
  reason: string;
};

export type ResourcesApiResponse = {
  resources: Resource[];
  recommendations: (Recommendation & { resource: Resource })[];
  subjectCounts: Partial<Record<ResourceSubject, number>>;
  examType: import("@/config/exam-config").ExamType | null;
};
