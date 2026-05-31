"use client";

export function QuickActions({
  actions,
  onSelect,
}: {
  actions: string[];
  onSelect?: (action: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          key={action}
          type="button"
          onClick={() => onSelect?.(action)}
          className="cursor-pointer rounded-full border border-[#8B5CF6]/25 bg-[#8B5CF6]/10 px-3.5 py-1.5 text-xs font-medium text-[#C4B5FD] transition-colors hover:border-[#8B5CF6]/40 hover:bg-[#8B5CF6]/20"
        >
          {action}
        </button>
      ))}
    </div>
  );
}
