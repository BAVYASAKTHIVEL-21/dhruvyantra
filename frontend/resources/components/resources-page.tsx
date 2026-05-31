"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { isSubjectAllowedForExam } from "@/lib/resources/exam-filter";
import type { ExamType } from "@/config/exam-config";
import {
  buildSubjectSummaries,
  fetchResources,
  filterByQuickAccessTag,
  getQuickAccess,
  getRecentFiles,
  getRecommendationsWithResources,
  searchResources,
} from "../services/resourceService";
import type { Recommendation, Resource, ResourceFilter, ResourceSubject } from "../types";
import { QuickAccessList } from "./quick-access-list";
import { RecentFileItem } from "./recent-file-item";
import { RecommendationCard } from "./recommendation-card";
import { ResourceCard } from "./resource-card";
import { ResourceCardSkeleton } from "./resource-card-skeleton";
import { ResourceFilterTabs } from "./resource-filter-tabs";
import { ResourcesHero } from "./resources-hero";
import { StorageCard } from "./storage-card";
import { SubjectCard } from "./subject-card";

const SEARCH_DEBOUNCE_MS = 320;

export function ResourcesPage() {
  const { profile } = useProfile();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ResourceFilter>("All");
  const [subjectFilter, setSubjectFilter] = useState<ResourceSubject | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [recommendations, setRecommendations] = useState<
    (Recommendation & { resource: Resource })[]
  >([]);
  const [subjectSummaries, setSubjectSummaries] = useState(
    buildSubjectSummaries({}),
  );
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [examType, setExamType] = useState<ExamType | null>(null);
  const [libraryResources, setLibraryResources] = useState<Resource[]>([]);

  useEffect(() => {
    const topic = searchParams.get("topic");
    const q = searchParams.get("q");
    const type = searchParams.get("type");
    const subject = searchParams.get("subject");
    if (topic) setQuery(topic);
    else if (q) setQuery(q);
    if (type && type !== "All") setTypeFilter(type as ResourceFilter);
    if (subject) setSubjectFilter(subject as ResourceSubject);
  }, [searchParams]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  const loadResources = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const data = await fetchResources({
        search: debouncedQuery || undefined,
        subject: subjectFilter,
      });
      const resolvedExam = data.examType ?? profile?.examType ?? null;
      setExamType(resolvedExam);
      setResources(data.resources);
      setRecommendations(data.recommendations);
      setSubjectSummaries(buildSubjectSummaries(data.subjectCounts, resolvedExam));
      if (!debouncedQuery && !subjectFilter) {
        setLibraryResources(data.resources);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load resources");
    } finally {
      setLoading(false);
      setFetching(false);
    }
  }, [debouncedQuery, subjectFilter, profile?.examType]);

  useEffect(() => {
    const resolvedExam = examType ?? profile?.examType ?? null;
    if (subjectFilter && resolvedExam && !isSubjectAllowedForExam(resolvedExam, subjectFilter)) {
      setSubjectFilter(null);
    }
  }, [examType, profile?.examType, subjectFilter]);

  useEffect(() => {
    void loadResources();
  }, [loadResources]);

  const filtered = useMemo(
    () => searchResources(resources, "", typeFilter),
    [resources, typeFilter],
  );

  const topPicks = useMemo(
    () => filtered.filter((r) => r.featured || r.recommended).slice(0, 5),
    [filtered],
  );

  const displayPicks = topPicks.length > 0 ? topPicks : filtered.slice(0, 5);

  const displayRecommendations = useMemo(
    () => getRecommendationsWithResources(recommendations),
    [recommendations],
  );

  const quickAccessItems = useMemo(
    () => getQuickAccess(libraryResources),
    [libraryResources],
  );

  const recentFiles = useMemo(
    () => getRecentFiles(libraryResources),
    [libraryResources],
  );

  const handleQuickAccess = (tag: string) => {
    setQuery("");
    setSubjectFilter(null);
    const tagged = filterByQuickAccessTag(libraryResources, tag);
    if (tagged.length > 0) setTypeFilter(tagged[0].type);
  };

  const handleSubjectSelect = (name: ResourceSubject) => {
    setSubjectFilter((prev) => (prev === name ? null : name));
  };

  const showSkeleton = loading && resources.length === 0;
  const showEmpty = !loading && !error && filtered.length === 0;

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-7 w-7 text-[#8B5CF6]" />
          <h1 className="font-heading text-3xl font-bold tracking-tight text-[#F8FAFC] md:text-4xl">
            Resources
          </h1>
        </div>
        <p className="mt-1 text-sm text-[#94A3B8]">
          {profile?.examType
            ? `${profile.examType} library · prioritized for ${profile.weakTopics[0] ?? profile.weakSubjects[0] ?? "your weak areas"}`
            : "Everything you need to learn, revise and master."}
        </p>
      </motion.header>

      <div className="dash-search mb-4 flex items-center gap-2 rounded-xl px-3.5 py-2.5">
        <Search className="h-4 w-4 shrink-0 text-[#6B7A90]" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes, books, pyqs..."
          className="w-full bg-transparent text-sm text-[#F8FAFC] outline-none placeholder:text-[#6B7A90]"
        />
        {fetching && !loading ? (
          <span className="h-3 w-3 shrink-0 animate-pulse rounded-full bg-[#8B5CF6]/60" />
        ) : null}
      </div>

      <div className="mb-6">
        <ResourceFilterTabs active={typeFilter} onChange={setTypeFilter} />
        {subjectFilter ? (
          <button
            type="button"
            onClick={() => setSubjectFilter(null)}
            className="mt-2 cursor-pointer text-xs text-[#8B5CF6] hover:underline"
          >
            Clear subject: {subjectFilter} ×
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="dash-glass-card mb-6 rounded-2xl p-5 text-center">
          <p className="text-sm text-[#F87171]">{error}</p>
          <button
            type="button"
            onClick={() => void loadResources()}
            className="btn-gradient-glow mt-3 cursor-pointer rounded-lg px-4 py-2 text-xs font-semibold text-white"
          >
            Try again
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          <ResourcesHero />

          <section>
            <h2 className="font-heading text-lg font-bold text-[#F8FAFC]">Browse by Subjects</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {subjectSummaries.map((s) => (
                <SubjectCard key={s.id} subject={s} onSelect={handleSubjectSelect} />
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold text-[#F8FAFC]">Top Picks for You</h2>
              <span className="text-xs text-[#6B7A90]">
                {showSkeleton ? "…" : `${displayPicks.length} items`}
              </span>
            </div>
            <AnimatePresence mode="popLayout">
              {showSkeleton ? (
                <motion.div
                  layout
                  className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {Array.from({ length: 6 }).map((_, i) => (
                    <ResourceCardSkeleton key={i} />
                  ))}
                </motion.div>
              ) : showEmpty ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 text-sm text-[#6B7A90]"
                >
                  No resources match your search. Try another filter.
                </motion.p>
              ) : (
                <motion.div
                  layout
                  className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {displayPicks.map((resource, i) => (
                    <motion.div
                      key={resource.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <ResourceCard resource={resource} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <section>
            <h2 className="font-heading text-lg font-bold text-[#F8FAFC]">
              Recommended Study Material
            </h2>
            <p className="mt-1 text-xs text-[#6B7A90]">
              {profile?.examType
                ? profile.examType === "JEE"
                  ? "PYQs, DPPs, and advanced sheets for your weak topics"
                  : "NCERT notes, diagrams, and revision for your weak topics"
                : "AI picks based on weak topics & your mission plan"}
            </p>
            {showSkeleton ? (
              <div className="mt-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="dash-glass-card h-24 animate-pulse rounded-2xl bg-white/[0.04]"
                  />
                ))}
              </div>
            ) : displayRecommendations.length === 0 ? (
              <p className="mt-4 text-sm text-[#6B7A90]">
                Complete onboarding to unlock personalized recommendations.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {displayRecommendations.map((rec) => (
                  <RecommendationCard
                    key={rec.id}
                    recommendation={rec}
                    resource={rec.resource}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <QuickAccessList items={quickAccessItems} onSelect={handleQuickAccess} />
          <div className="dash-glass-card rounded-2xl p-5">
            <h3 className="font-heading text-sm font-bold text-[#F8FAFC]">Recent Files</h3>
            <ul className="mt-2">
              {recentFiles.length === 0 ? (
                <li className="py-2 text-xs text-[#6B7A90]">No recent files for your exam library.</li>
              ) : (
                recentFiles.map((file) => (
                  <li key={file.id}>
                    <RecentFileItem file={file} />
                  </li>
                ))
              )}
            </ul>
          </div>
          <StorageCard />
        </aside>
      </div>
    </>
  );
}
