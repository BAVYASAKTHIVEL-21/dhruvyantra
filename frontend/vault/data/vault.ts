import type {
  ActivityItem,
  AiSummary,
  QuickRevision,
  StorageBreakdown,
  VaultFile,
  VaultFolder,
} from "../types";

export const RECENT_FILES: VaultFile[] = [
  {
    id: "f1",
    name: "Electrostatics Complete Notes.pdf",
    subject: "Physics",
    type: "pdf",
    size: "24 MB",
    openedAt: "2h ago",
    tags: ["electrostatics", "notes", "physics"],
  },
  {
    id: "f2",
    name: "Organic Chemistry PYQs.pdf",
    subject: "Chemistry",
    type: "pdf",
    size: "18 MB",
    openedAt: "5h ago",
    tags: ["organic", "pyq", "chemistry"],
  },
  {
    id: "f3",
    name: "Calculus Formula Sheet.pdf",
    subject: "Mathematics",
    type: "pdf",
    size: "4 MB",
    openedAt: "Yesterday",
    tags: ["calculus", "formula", "math"],
  },
  {
    id: "f4",
    name: "Thermodynamics Mind Map.png",
    subject: "Physics",
    type: "image",
    size: "8 MB",
    openedAt: "Yesterday",
    tags: ["thermodynamics", "mind map"],
  },
];

export const FOLDERS: VaultFolder[] = [
  { id: "d1", name: "Physics", fileCount: 128 },
  { id: "d2", name: "Chemistry", fileCount: 96 },
  { id: "d3", name: "Mathematics", fileCount: 112 },
  { id: "d4", name: "Biology", fileCount: 64 },
  { id: "d5", name: "Mock Analysis", fileCount: 42 },
  { id: "d6", name: "AI Summaries", fileCount: 28 },
];

export const AI_SUMMARIES: AiSummary[] = [
  { id: "s1", title: "Thermodynamics Summary", pages: 12, subject: "Physics" },
  { id: "s2", title: "Organic Chemistry Reaction Summary", pages: 18, subject: "Chemistry" },
  { id: "s3", title: "Vector 3D Formula Sheet", pages: 6, subject: "Mathematics" },
  { id: "s4", title: "Modern Physics Quick Notes", pages: 10, subject: "Physics" },
];

export const QUICK_REVISION: QuickRevision[] = [
  { id: "r1", label: "Formula Sheets", fileCount: 24, icon: "formula" },
  { id: "r2", label: "Important Mistakes", fileCount: 16, icon: "mistakes" },
  { id: "r3", label: "Weak Topic Notes", fileCount: 12, icon: "weak" },
  { id: "r4", label: "High Weightage", fileCount: 20, icon: "weightage" },
];

export const STORAGE = {
  usedGb: 6.4,
  totalGb: 20,
};

export const STORAGE_BREAKDOWN: StorageBreakdown[] = [
  { label: "PDF Files", gb: 3.2, color: "#8B5CF6" },
  { label: "Images", gb: 1.4, color: "#38BDF8" },
  { label: "Documents", gb: 1.2, color: "#22C55E" },
  { label: "Other", gb: 0.6, color: "#94A3B8" },
];

export const QUICK_ACCESS = [
  { id: "q1", label: "Most Opened", icon: "trending" as const },
  { id: "q2", label: "Starred Files", icon: "star" as const },
  { id: "q3", label: "Downloaded", icon: "download" as const },
  { id: "q4", label: "Shared with Me", icon: "share" as const },
];

export const RECENT_ACTIVITY: ActivityItem[] = [
  { id: "a1", action: "Opened Electrostatics Notes.pdf", time: "2h ago", type: "open" },
  { id: "a2", action: "Uploaded Formula Sheet.pdf", time: "5h ago", type: "upload" },
  { id: "a3", action: "Generated AI Summary", time: "Yesterday", type: "ai" },
  {
    id: "a4",
    action: "Moved Organic PYQs to Revision Folder",
    time: "Yesterday",
    type: "move",
  },
];

export const AI_ORGANIZATION = {
  untaggedCount: 12,
  message:
    "You have 12 untagged files. AI suggests organizing them into proper folders for better revision.",
};
