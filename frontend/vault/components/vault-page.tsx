"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Vault } from "lucide-react";
import {
  fetchVaultFiles,
  getAiSummaries,
  getFolders,
  getQuickRevision,
  searchVault,
  uploadVaultFile,
} from "../services/vaultService";
import { AiSummariesSection } from "./ai-summaries-section";
import { FoldersGrid } from "./folders-grid";
import { QuickRevisionSection } from "./quick-revision-section";
import { RecentFilesSection } from "./recent-files-section";
import { SmartTipBar } from "./smart-tip-bar";
import { VaultActionBar } from "./vault-action-bar";
import { VaultSidebarPanel } from "./vault-sidebar-panel";
import type { VaultFile } from "../types";

export function VaultPage() {
  const [query, setQuery] = useState("");
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [driveConfigured, setDriveConfigured] = useState(false);
  const [setupHint, setSetupHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVaultFiles();
      setDriveConfigured(data.configured);
      setSetupHint(data.setupHint ?? null);
      setFiles(data.files);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load vault files");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  const visibleFiles = useMemo(() => searchVault(query, files), [query, files]);

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      setError(null);
      try {
        const uploaded = await uploadVaultFile(file);
        setFiles((prev) => [uploaded, ...prev]);
        setDriveConfigured(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [],
  );

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <div className="flex items-center gap-2">
          <Vault className="h-7 w-7 text-[#8B5CF6]" />
          <h1 className="font-heading text-3xl font-bold tracking-tight text-[#F8FAFC] md:text-4xl">
            Vault
          </h1>
        </div>
        <p className="mt-1 text-sm text-[#94A3B8]">
          Your personal study archive. Secure. Organized. Intelligent.
          {driveConfigured ? " · Synced from Google Drive" : ""}
        </p>
      </motion.header>

      <div className="dash-search mb-4 flex items-center gap-2 rounded-xl px-3.5 py-2.5">
        <Search className="h-4 w-4 shrink-0 text-[#6B7A90]" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search files, folders, tags…"
          className="w-full bg-transparent text-sm text-[#F8FAFC] outline-none placeholder:text-[#6B7A90]"
        />
      </div>

      {error ? <p className="mb-3 text-sm text-[#FCA5A5]">{error}</p> : null}

      {!loading && !driveConfigured && setupHint ? (
        <div className="mb-4 rounded-xl border border-[#FBBF24]/30 bg-[#FBBF24]/10 px-4 py-3 text-sm text-[#FDE68A]">
          <p className="font-medium">Google Drive not connected</p>
          <p className="mt-1 text-xs leading-relaxed text-[#FCD34D]/90">{setupHint}</p>
        </div>
      ) : null}

      <div className="mb-6">
        <VaultActionBar
          onUpload={handleUpload}
          uploading={uploading}
          driveConfigured={driveConfigured}
          setupHint={setupHint}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          <RecentFilesSection files={visibleFiles} loading={loading} />
          <FoldersGrid folders={getFolders()} />
          <AiSummariesSection summaries={getAiSummaries()} />
          <QuickRevisionSection items={getQuickRevision()} />
          <SmartTipBar />
        </div>
        <VaultSidebarPanel />
      </div>
    </>
  );
}
