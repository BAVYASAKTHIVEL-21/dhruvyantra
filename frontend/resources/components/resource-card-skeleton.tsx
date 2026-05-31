"use client";

export function ResourceCardSkeleton() {
  const bar = "animate-pulse rounded bg-white/[0.06]";

  return (
    <article className="dash-glass-card flex flex-col overflow-hidden rounded-2xl">
      <div className={`h-28 rounded-t-xl ${bar}`} />
      <div className="flex flex-1 flex-col p-4">
        <div className={`h-4 w-3/4 ${bar}`} />
        <div className={`mt-2 h-3 w-1/2 ${bar}`} />
        <div className={`mt-2 h-3 w-2/5 ${bar}`} />
        <div className={`mt-auto h-3 w-16 ${bar} pt-6`} />
      </div>
    </article>
  );
}
