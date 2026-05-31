import type { QuickAccessItem, RecentFile, StorageUsage } from "../types";

/** Sidebar / quick-access UI data — not stored in Notion */
export const QUICK_ACCESS: QuickAccessItem[] = [
  { id: "qa1", label: "Formula Sheets", icon: "formula", filterTag: "formula" },
  { id: "qa2", label: "Mind Maps", icon: "mindmap", filterTag: "mind map" },
  { id: "qa3", label: "Revision Notes", icon: "notes", filterTag: "revision" },
  { id: "qa4", label: "Important Diagrams", icon: "diagram", filterTag: "diagram" },
  { id: "qa5", label: "Chapterwise PYQs", icon: "pyq", filterTag: "pyq" },
];

export const RECENT_FILES: RecentFile[] = [
  { id: "f1", title: "Modern Physics Notes.pdf", type: "Notes", openedAt: "2h ago", resourceId: "r1" },
  { id: "f2", title: "Rotational Motion DPP.pdf", type: "DPPs", openedAt: "5h ago", resourceId: "r11" },
  { id: "f3", title: "Organic Mechanisms Video", type: "Videos", openedAt: "Yesterday", resourceId: "r5" },
  { id: "f4", title: "Calculus DPP Set 4.pdf", type: "DPPs", openedAt: "Yesterday", resourceId: "r4" },
  { id: "f5", title: "Electrostatics PYQs 2024.pdf", type: "PYQs", openedAt: "2 days ago", resourceId: "r2" },
];

export const STORAGE_USAGE: StorageUsage = {
  usedGb: 2.4,
  totalGb: 10,
};

/** Subject icon mapping for Browse by Subjects cards */
export const SUBJECT_ICONS = {
  Physics: "physics",
  Chemistry: "chemistry",
  Mathematics: "math",
  Biology: "biology",
  Others: "other",
} as const;
