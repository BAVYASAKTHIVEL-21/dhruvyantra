export type VaultFileType = "pdf" | "image" | "doc" | "other";

export type VaultSubject =
  | "Physics"
  | "Chemistry"
  | "Mathematics"
  | "Biology"
  | "Mixed";

export type VaultFile = {
  id: string;
  name: string;
  subject: VaultSubject;
  type: VaultFileType;
  size: string;
  openedAt: string;
  tags: string[];
  url?: string;
  mimeType?: string;
};

export type VaultFolder = {
  id: string;
  name: string;
  fileCount: number;
};

export type AiSummary = {
  id: string;
  title: string;
  pages: number;
  subject: VaultSubject;
};

export type QuickRevision = {
  id: string;
  label: string;
  fileCount: number;
  icon: "formula" | "mistakes" | "weak" | "weightage";
};

export type ActivityItem = {
  id: string;
  action: string;
  time: string;
  type: "open" | "upload" | "ai" | "move";
};

export type StorageBreakdown = {
  label: string;
  gb: number;
  color: string;
};
