/**
 * Connections data layer — demo mocks today; Coral/agent later.
 */

import {
  COLLABORATION_IMPACT,
  COMMUNITIES,
  RECENT_ACTIVITY,
  RECOMMENDED_STUDENTS,
  STATS,
  STUDY_GROUPS,
  UPCOMING_SESSIONS,
} from "../data";
import type { StudentConnection, StudyGroup } from "../data";

export function getStats() {
  return STATS;
}

export function getRecommendedStudents() {
  return RECOMMENDED_STUDENTS;
}

export function getStudyGroups() {
  return STUDY_GROUPS;
}

export function searchConnections(
  query: string,
  students: StudentConnection[],
  groups: StudyGroup[],
) {
  const q = query.trim().toLowerCase();
  if (!q) return { students, groups };
  return {
    students: students.filter((s) =>
      [s.name, s.exam, s.target, ...s.tags].join(" ").toLowerCase().includes(q),
    ),
    groups: groups.filter((g) =>
      [g.name, ...g.tags].join(" ").toLowerCase().includes(q),
    ),
  };
}

export function getCommunities() {
  return COMMUNITIES;
}

export function getUpcomingSessions() {
  return UPCOMING_SESSIONS;
}

export function getRecentActivity() {
  return RECENT_ACTIVITY;
}

export function getCollaborationImpact() {
  return COLLABORATION_IMPACT;
}
