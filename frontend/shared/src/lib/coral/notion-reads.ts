import type { StudyTask } from "@/types/planner";
import type { Resource } from "@/types/resource";
import {
  pageFromCoralRow,
  readDate,
  readRichText,
  resourceFromPage,
  taskFromPage,
} from "@/lib/notion/mappers";
import { dedupeStudyTasks, limitTodayTasks } from "@/lib/planner/planner-dedupe";
import { assertCoralEnabled } from "./query";
import { fetchDataSourcePages } from "./notion-source";

function mapPagesToTasks(pages: { id: string; properties: unknown; created_time?: string }[]): StudyTask[] {
  const tasks: StudyTask[] = [];
  for (const page of pages) {
    const normalized = pageFromCoralRow({
      id: page.id,
      properties: page.properties,
      created_time: page.created_time,
    });
    if (!normalized) continue;
    const mapped = taskFromPage(normalized);
    if (mapped) tasks.push(mapped);
  }
  return tasks;
}

function mapPagesToResources(
  pages: { id: string; properties: unknown; created_time?: string }[],
): Resource[] {
  const resources: Resource[] = [];
  for (const page of pages) {
    const normalized = pageFromCoralRow({
      id: page.id,
      properties: page.properties,
      created_time: page.created_time,
    });
    if (!normalized) continue;
    const mapped = resourceFromPage({
      id: normalized.id as string,
      properties: normalized.properties,
    });
    if (mapped) resources.push(mapped);
  }
  return resources;
}

function normalizeStudentId(value: string): string {
  return value.trim().toLowerCase();
}

function matchesStudentId(props: Record<string, { type: string; [k: string]: unknown }>, studentIds: string[]): boolean {
  const sid = readRichText(props, "Student ID");
  if (!sid) return false;
  const normalized = new Set(studentIds.map(normalizeStudentId));
  return normalized.has(normalizeStudentId(sid));
}

function notionPropsFromPage(
  page: { id: string; properties: unknown; created_time?: string },
): Record<string, { type: string; [k: string]: unknown }> | null {
  const normalized = pageFromCoralRow({
    id: page.id,
    properties: page.properties,
    created_time: page.created_time,
  });
  if (!normalized?.properties || typeof normalized.properties !== "object") return null;
  return normalized.properties as Record<string, { type: string; [k: string]: unknown }>;
}

function filterTaskPages(
  pages: { id: string; properties: unknown; created_time?: string }[],
  studentIds: string[],
  date?: string,
  startDate?: string,
  endDate?: string,
): typeof pages {
  return pages.filter((page) => {
    const props = notionPropsFromPage(page);
    if (!props) return false;
    if (!matchesStudentId(props, studentIds)) return false;
    const taskDate = readDate(props, "Date");
    if (date) return taskDate === date;
    if (startDate && endDate) return taskDate >= startDate && taskDate <= endDate;
    return true;
  });
}

/** Read study tasks for one date via Coral SQL only. */
export async function fetchStudyTasksForDateViaCoral(
  studentIds: string | string[],
  date: string,
): Promise<StudyTask[]> {
  assertCoralEnabled();
  const ids = Array.isArray(studentIds) ? studentIds : [studentIds];
  const pages = await fetchDataSourcePages("studyPlans");
  const filtered = filterTaskPages(pages, ids, date);
  const tasks = limitTodayTasks(
    dedupeStudyTasks(mapPagesToTasks(filtered)),
    date,
  ).sort((a, b) => a.duration - b.duration);

  if (
    tasks.length === 0 &&
    pages.length > 0 &&
    (process.env.CORAL_DEBUG_SQL === "true" || process.env.CORAL_DEBUG_NOTION === "true")
  ) {
    const forStudent = filterTaskPages(pages, ids);
    console.info(
      `[coral/notion] studyPlans: ${pages.length} pages, ${forStudent.length} for student, 0 for date=${date}`,
    );
  }

  return tasks;
}

/** Cap range reads so Mission Control / analytics stay responsive with large Notion DBs. */
const MAX_RANGE_TASKS = 120;

/** Read study tasks for a date range via Coral SQL only. */
export async function fetchStudyTasksForRangeViaCoral(
  studentIds: string | string[],
  startDate: string,
  endDate: string,
): Promise<StudyTask[]> {
  assertCoralEnabled();
  const ids = Array.isArray(studentIds) ? studentIds : [studentIds];
  const pages = await fetchDataSourcePages("studyPlans");
  const filtered = filterTaskPages(pages, ids, undefined, startDate, endDate);
  const tasks = dedupeStudyTasks(mapPagesToTasks(filtered)).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  if (tasks.length <= MAX_RANGE_TASKS) return tasks;
  return tasks.slice(-MAX_RANGE_TASKS);
}

/** Read all resources via Coral → Notion. */
export async function fetchAllResourcesViaCoral(): Promise<Resource[]> {
  assertCoralEnabled();
  const pages = await fetchDataSourcePages("resources");
  return mapPagesToResources(pages);
}

/** Read user profile via Coral → Notion (first match by userId title). */
export async function fetchProfileViaCoral(userId: string): Promise<Record<string, unknown> | null> {
  assertCoralEnabled();
  const pages = await fetchDataSourcePages("profiles");

  for (const page of pages) {
    const props = page.properties as Record<string, { type: string; [k: string]: unknown }>;
    const title =
      props?.userId?.type === "title"
        ? ((props.userId.title as { plain_text: string }[])?.[0]?.plain_text ?? "")
        : readRichText(props, "userId");
    if (title === userId) {
      return pageFromCoralRow({
        id: page.id,
        properties: page.properties,
        created_time: page.created_time,
      });
    }
  }
  return null;
}
