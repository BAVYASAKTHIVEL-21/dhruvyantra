import { NextResponse } from "next/server";
import {
  getAllResources,
  getRecommendedResources,
  getResourcesBySubject,
  searchResources,
} from "@/lib/resources/notion";
import {
  countBySubjectForExam,
  filterResourcesForExam,
  isSubjectAllowedForExam,
} from "@/lib/resources/exam-filter";
import { getProfile, getSessionUserId } from "@/lib/profile/server";
import { filterSubjectsForExam } from "@/config/exam-config";
import { getLatestMockSubmission } from "@/lib/mock-center/store";
import { mergeMockIntoResourceRecommendations } from "@/lib/resources/mock-recovery";
import { getWeaknessEngineForSession } from "@/lib/weakness/server";
import { topicMatchesText } from "@/services/weakness-engine/topic-resolution";
import type { ResourceSubject } from "@/types/resource";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const subjectParam = searchParams.get("subject");

    const profile = await getProfile();
    const userId = await getSessionUserId();
    const weakness = await getWeaknessEngineForSession();
    const latestMock = userId ? await getLatestMockSubmission(userId) : null;
    const examType = profile?.examType ?? null;
    const weakSubjects =
      examType && profile
        ? filterSubjectsForExam(examType, profile.weakSubjects)
        : (profile?.weakSubjects ?? []);
    const weakTopics =
      weakness?.weakTopicNames.length ? weakness.weakTopicNames : (profile?.weakTopics ?? []);

    // One Coral SQL read per request (was calling getAllResources twice → ~2× latency).
    const allResources = filterResourcesForExam(await getAllResources(), examType);

    let resources = allResources;

    if (
      subjectParam &&
      isSubjectAllowedForExam(examType, subjectParam as ResourceSubject)
    ) {
      resources = getResourcesBySubject(resources, subjectParam as ResourceSubject);
    }

    if (search.trim()) {
      resources = searchResources(resources, search);
    }

    const recommendations = mergeMockIntoResourceRecommendations(
      getRecommendedResources(resources, weakSubjects, weakTopics, examType),
      latestMock,
    );

    const marked = resources.map((r) => ({
      ...r,
      weakTopicRelated:
        weakTopics.some((wt) =>
          topicMatchesText(wt, [r.title, r.topic, r.subject, ...r.tags].join(" ")),
        ) ||
        weakSubjects.some((ws) =>
          [r.title, r.topic, r.subject, ...r.tags].join(" ").toLowerCase().includes(ws.toLowerCase()),
        ),
      featured: r.featured || r.recommended,
    }));

    const examFilteredAll = allResources;

    return NextResponse.json({
      resources: marked,
      recommendations,
      subjectCounts: countBySubjectForExam(examFilteredAll, examType),
      examType,
    });
  } catch (e) {
    console.error("[api/resources]", e);
    return NextResponse.json(
      { error: "Failed to load resources" },
      { status: 500 },
    );
  }
}
