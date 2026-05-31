import type { StudyTask, TaskStatus } from "@/types/planner";
import type {
  Resource,
  ResourceDifficulty,
  ResourceSubject,
  ResourceType,
} from "@/types/resource";

export const TASK_STATUSES: TaskStatus[] = ["Pending", "In Progress", "Completed"];
export const TASK_PRIORITIES = ["High", "Medium", "Low"] as const;
export const TASK_SUBJECTS = [
  "Physics",
  "Chemistry",
  "Mathematics",
  "Biology",
  "Practice",
  "Full Length Test",
  "General",
] as const;

export const RESOURCE_SUBJECTS: ResourceSubject[] = [
  "Physics",
  "Chemistry",
  "Mathematics",
  "Biology",
  "Others",
];

export const RESOURCE_TYPES: ResourceType[] = [
  "Notes",
  "Books",
  "PYQs",
  "DPPs",
  "Videos",
  "Others",
];

export const RESOURCE_DIFFICULTIES: ResourceDifficulty[] = ["Easy", "Medium", "Hard"];

type NotionProps = Record<string, { type: string; [k: string]: unknown }>;

export function readTitle(props: NotionProps): string {
  for (const key of ["Task", "Title", "Name", "title", "userId"]) {
    const p = props[key];
    if (p?.type === "title") {
      return (p.title as { plain_text: string }[])?.[0]?.plain_text ?? "";
    }
  }
  return "";
}

export function readRichText(props: NotionProps, key: string): string {
  const p = props[key];
  if (p?.type === "rich_text") {
    return (p.rich_text as { plain_text: string }[])?.[0]?.plain_text ?? "";
  }
  return "";
}

export function readSelect(
  props: NotionProps,
  key: string,
  allowed: readonly string[],
  fallback: string,
): string {
  const p = props[key];
  if (p?.type === "select" && p.select) {
    const name = (p.select as { name: string }).name;
    if (allowed.includes(name)) return name;
  }
  return fallback;
}

export function readMultiSelect(props: NotionProps, key: string): string[] {
  const p = props[key];
  if (p?.type === "multi_select" && Array.isArray(p.multi_select)) {
    return (p.multi_select as { name: string }[]).map((o) => o.name);
  }
  return [];
}

export function readNumber(props: NotionProps, key: string): number {
  const p = props[key];
  return p?.type === "number" ? Number(p.number ?? 0) : 0;
}

export function readCheckbox(props: NotionProps, key: string): boolean {
  const p = props[key];
  return p?.type === "checkbox" ? Boolean(p.checkbox) : false;
}

export function readDate(props: NotionProps, key: string): string {
  const p = props[key];
  if (p?.type === "date" && p.date) {
    return (p.date as { start: string }).start?.slice(0, 10) ?? "";
  }
  return "";
}

export function readUrl(props: NotionProps, key: string): string | undefined {
  const p = props[key];
  if (p?.type === "url" && typeof p.url === "string" && p.url) return p.url;
  return undefined;
}

function thumbnailKeyFromResource(
  subject: ResourceSubject,
  topic: string,
  type: ResourceType,
): string {
  const t = topic.toLowerCase();
  if (t.includes("electrostatic")) return "electrostatics";
  if (t.includes("rotational")) return "rotation";
  if (t.includes("thermo")) return "formula";
  if (t.includes("organic")) return "formula";
  if (t.includes("calculus") || t.includes("vector") || t.includes("probability")) return "math";
  if (t.includes("cell") || t.includes("physiology") || t.includes("biology")) return "biology";
  if (type === "PYQs") return "pyqs";
  if (type === "Books") return "book";
  if (type === "DPPs") return "dpp";
  if (type === "Videos") return "video";
  if (subject === "Chemistry") return "chemistry";
  if (subject === "Physics") return "electrostatics";
  return "default";
}

function deriveRating(id: string): { rating: number; reviewCount: number } {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i) * (i + 1)) % 997;
  return {
    rating: Math.round((4.4 + (hash % 6) * 0.1) * 10) / 10,
    reviewCount: 40 + (hash % 900),
  };
}

export function taskFromPage(page: Record<string, unknown>): StudyTask | null {
  const props = page.properties as NotionProps | undefined;
  if (!props) return null;

  const title = readTitle(props);
  const studentId = readRichText(props, "Student ID");
  if (!title || !studentId) return null;

  let recommendedResourceIds: string[] = [];
  try {
    const raw = readRichText(props, "Recommended Resource IDs");
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        recommendedResourceIds = parsed.filter((id): id is string => typeof id === "string");
      }
    }
  } catch {
    recommendedResourceIds = [];
  }

  const status = readSelect(props, "Status", TASK_STATUSES, "Pending") as TaskStatus;
  const created = page.created_time as string | undefined;

  return {
    id: page.id as string,
    studentId,
    title,
    subject: readSelect(props, "Subject", TASK_SUBJECTS, "General"),
    topic: readRichText(props, "Topic") || "General",
    priority: readSelect(props, "Priority", TASK_PRIORITIES, "Medium") as StudyTask["priority"],
    date: readDate(props, "Date"),
    duration: readNumber(props, "Duration") || 30,
    status,
    aiGenerated: readCheckbox(props, "AI Generated"),
    recommendedResourceIds,
    scheduledTime: readRichText(props, "Schedule") || undefined,
    createdAt: created,
  };
}

export function resourceFromPage(page: Record<string, unknown>): Resource | null {
  const props = page.properties as NotionProps | undefined;
  if (!props) return null;

  const title = readTitle(props);
  if (!title) return null;

  const subject = readSelect(props, "Subject", RESOURCE_SUBJECTS, "Others") as ResourceSubject;
  const topic = readRichText(props, "Topic") || "General";
  const type = readSelect(props, "Type", RESOURCE_TYPES, "Others") as ResourceType;
  const difficulty = readSelect(
    props,
    "Difficulty",
    RESOURCE_DIFFICULTIES,
    "Medium",
  ) as ResourceDifficulty;
  const tags = readMultiSelect(props, "Tags");
  const driveUrl = readUrl(props, "Drive URL");
  const recommended = readCheckbox(props, "Recommended");
  const thumbnailUrl = readUrl(props, "Thumbnail");
  const duration = readRichText(props, "Duration") || undefined;
  const fileSize = readRichText(props, "File Size") || undefined;
  const id = page.id as string;
  const { rating, reviewCount } = deriveRating(id);

  return {
    id,
    title,
    subject,
    topic,
    type,
    difficulty,
    tags,
    driveUrl,
    recommended,
    thumbnail: thumbnailKeyFromResource(subject, topic, type),
    thumbnailUrl,
    duration,
    fileSize,
    rating,
    reviewCount,
    featured: recommended,
    weakTopicRelated: false,
    source: "notion",
    classLabel: `${subject} · ${topic}`,
  };
}

export function pageFromCoralRow(row: Record<string, unknown>): Record<string, unknown> | null {
  const id = row.id;
  if (typeof id !== "string") return null;

  let properties = row.properties;
  if (typeof properties === "string") {
    try {
      properties = JSON.parse(properties);
    } catch {
      return null;
    }
  }
  if (!properties || typeof properties !== "object") return null;

  const created =
    typeof row.created_time === "string"
      ? row.created_time
      : row.created_time instanceof Date
        ? row.created_time.toISOString()
        : undefined;

  return { id, properties, created_time: created };
}
