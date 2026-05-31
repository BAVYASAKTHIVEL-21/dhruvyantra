"use client";

import { motion } from "framer-motion";
import { Folder } from "lucide-react";
import type { VaultFolder } from "../types";

export function FoldersGrid({ folders }: { folders: VaultFolder[] }) {
  return (
    <section>
      <h3 className="font-heading text-base font-bold text-[#F8FAFC]">My Folders</h3>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {folders.map((folder, i) => (
          <motion.button
            key={folder.id}
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="vault-folder-card group flex cursor-pointer flex-col items-center rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition-all hover:-translate-y-1 hover:border-[#8B5CF6]/30 hover:shadow-[0_0_28px_rgba(139,92,246,0.15)]"
          >
            <div className="vault-folder-glow flex h-14 w-14 items-center justify-center rounded-xl transition-transform group-hover:scale-105">
              <Folder className="h-8 w-8 text-[#A78BFA]" fill="rgba(139,92,246,0.2)" />
            </div>
            <p className="mt-3 font-heading text-sm font-bold text-[#F8FAFC]">
              {folder.name}
            </p>
            <p className="mt-0.5 text-[11px] text-[#6B7A90]">
              {folder.fileCount} Files
            </p>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
