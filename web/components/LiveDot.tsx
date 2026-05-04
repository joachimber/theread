"use client";

export function LiveDot({ lastTs }: { lastTs: string | number | null }) {
  if (!lastTs) {
    return (
      <span className="inline-flex items-center gap-1.5 eyebrow">
        <span className="w-1.5 h-1.5 bg-dim inline-block" /> idle
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 eyebrow">
      <span className="w-1.5 h-1.5 inline-block bg-accent animate-pulse" />
      <span className="text-accent">Live</span>
    </span>
  );
}
