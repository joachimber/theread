"use client";

import { useEffect, useState } from "react";

export function LiveDot({ lastTs }: { lastTs: string | number | null }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!lastTs) {
    return (
      <span className="inline-flex items-center gap-1.5 eyebrow">
        <span className="w-1.5 h-1.5 bg-dim inline-block" /> idle
      </span>
    );
  }
  const ts = typeof lastTs === "string" ? new Date(lastTs).getTime() : lastTs;
  const ageSec = Math.max(0, (now - ts) / 1000);
  const isLive = ageSec < 90;
  return (
    <span className="inline-flex items-center gap-1.5 eyebrow">
      <span className={`w-1.5 h-1.5 inline-block ${isLive ? "bg-accent animate-pulse" : "bg-warn"}`} />
      <span className={isLive ? "text-accent" : "text-warn"}>
        {isLive ? "Live" : `${Math.round(ageSec)}s lag`}
      </span>
    </span>
  );
}
