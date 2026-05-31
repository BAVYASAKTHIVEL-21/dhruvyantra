"use client";

import { Bookmark, Download, Play, Star } from "lucide-react";
import type { Resource } from "../types";
import { ResourceThumbnail } from "./resource-thumbnail";

export function ResourceCard({ resource }: { resource: Resource }) {
  const isVideo = resource.type === "Videos";
  const meta = resource.duration ?? resource.fileSize ?? "—";

  return (
    <article className="dash-glass-card group flex flex-col overflow-hidden rounded-2xl transition-transform hover:-translate-y-0.5">
      <ResourceThumbnail resource={resource} />
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-heading text-sm font-bold leading-snug text-[#F8FAFC]">
          {resource.title}
        </h3>
        <p className="mt-1 text-xs text-[#6B7A90]">{resource.classLabel ?? resource.subject}</p>
        <p className="mt-0.5 text-[11px] text-[#94A3B8]">
          {resource.type} · {meta}
        </p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-center gap-1 text-xs text-[#EAB308]">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span className="font-medium text-[#F8FAFC]">{resource.rating}</span>
            <span className="text-[#6B7A90]">({resource.reviewCount})</span>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-[#94A3B8] hover:border-[#8B5CF6]/30 hover:text-[#F8FAFC]"
              aria-label="Bookmark"
            >
              <Bookmark className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-[#8B5CF6]/20 text-[#C4B5FD] hover:bg-[#8B5CF6]/35"
              aria-label={isVideo ? "Play" : "Download"}
            >
              {isVideo ? <Play className="h-4 w-4" /> : <Download className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
