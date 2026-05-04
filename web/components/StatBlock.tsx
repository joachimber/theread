interface StatBlockProps {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "up" | "down" | "warn";
  spark?: number[];
}

import { Sparkline } from "./Sparkline";

export function StatBlock({ label, value, sub, tone = "default", spark }: StatBlockProps) {
  const toneClass =
    tone === "up" ? "text-accent" : tone === "down" ? "text-red" : tone === "warn" ? "text-warn" : "text-ink";
  return (
    <div className="border border-line bg-panel p-5 flex flex-col gap-2 min-h-[112px] relative overflow-hidden">
      <div className="text-[10px] uppercase tracking-[0.2em] text-dim">{label}</div>
      <div className={`text-[28px] leading-none font-semibold tracking-tight tabular-nums ${toneClass}`}>{value}</div>
      {sub ? <div className="text-xs text-dim mt-auto">{sub}</div> : null}
      {spark?.length ? (
        <div className={`absolute right-3 bottom-3 ${toneClass} opacity-70`}>
          <Sparkline values={spark} width={70} height={20} />
        </div>
      ) : null}
    </div>
  );
}
