"use client";

import { motion } from "framer-motion";
import { Link2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { CONNECTION_TABS, type ConnectionTab } from "../data";
import {
  getRecommendedStudents,
  getStudyGroups,
  searchConnections,
} from "../services/connectionsService";
import { ConnectionTabs } from "./connection-tabs";
import { ConnectionsHero } from "./connections-hero";
import { ConnectionsSidebar } from "./connections-sidebar";
import { RecommendedConnections } from "./recommended-connections";
import { StatsRow } from "./stats-row";
import { StudyGroupsSection } from "./study-groups-section";

export function ConnectionsPage() {
  const [activeTab, setActiveTab] = useState<ConnectionTab>("discover");
  const [query, setQuery] = useState("");

  const { students, groups } = useMemo(() => {
    return searchConnections(
      query,
      getRecommendedStudents(),
      getStudyGroups(),
    );
  }, [query]);

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
      >
        <div>
          <div className="flex items-center gap-2">
            <Link2 className="h-7 w-7 text-[#8B5CF6]" />
            <h1 className="font-heading text-3xl font-bold tracking-tight text-[#F8FAFC] md:text-4xl">
              Connections
            </h1>
          </div>
          <p className="mt-1 text-sm text-[#94A3B8]">
            Learn together. Grow together. Achieve together.
          </p>
        </div>
        <ConnectionTabs active={activeTab} onChange={setActiveTab} />
      </motion.header>

      <div className="dash-search mb-6 flex items-center gap-2 rounded-xl px-3.5 py-2.5">
        <Search className="h-4 w-4 shrink-0 text-[#6B7A90]" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search students, groups, topics…"
          className="w-full bg-transparent text-sm text-[#F8FAFC] outline-none placeholder:text-[#6B7A90]"
        />
      </div>

      {activeTab === "discover" ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
          <div className="space-y-8">
            <ConnectionsHero />
            <StatsRow />
            <RecommendedConnections students={students} />
            <StudyGroupsSection groups={groups} />
          </div>
          <ConnectionsSidebar />
        </div>
      ) : (
        <div className="dash-glass-card rounded-2xl p-8 text-center">
          <p className="font-heading text-lg font-bold text-[#F8FAFC]">
            {CONNECTION_TABS.find((t) => t.id === activeTab)?.label}
          </p>
          <p className="mt-2 text-sm text-[#94A3B8]">
            Coming soon — use Discover to find study buddies and groups.
          </p>
        </div>
      )}
    </>
  );
}
