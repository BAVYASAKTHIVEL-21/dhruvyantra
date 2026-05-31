import type { Resource } from "../types";

const THUMB_STYLES: Record<string, string> = {
  electrostatics: "from-[#1e3a5f] via-[#312e81] to-[#0f172a]",
  pyqs: "from-[#4c1d95] to-[#1e1b4b]",
  book: "from-[#78350f] to-[#451a03]",
  dpp: "from-[#134e4a] to-[#042f2e]",
  video: "from-[#831843] to-[#4c0519]",
  rotation: "from-[#1e40af] to-[#172554]",
  formula: "from-[#365314] to-[#14532d]",
  math: "from-[#5b21b6] to-[#3b0764]",
  biology: "from-[#14532d] to-[#052e16]",
  mindmap: "from-[#713f12] to-[#422006]",
  default: "from-[#374151] to-[#111827]",
};

export function ResourceThumbnail({
  resource,
  className = "h-28",
}: {
  resource: Resource;
  className?: string;
}) {
  const grad = THUMB_STYLES[resource.thumbnail] ?? THUMB_STYLES.default;
  return (
    <div
      className={`relative overflow-hidden rounded-t-xl bg-gradient-to-br ${grad} ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.35),transparent_55%)]" />
      <span className="absolute bottom-2 left-2 rounded-md bg-black/40 px-2 py-0.5 text-[10px] font-medium text-[#E2E8F0] backdrop-blur-sm">
        {resource.type}
      </span>
    </div>
  );
}
