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
    <div className="border-r border-b border-line bg-paper p-4 md:p-6 flex flex-col gap-2 md:gap-2.5 min-h-[112px] md:min-h-[128px] relative overflow-hidden">
      <div className="eyebrow">{label}</div>
      <div className={`text-[24px] md:text-[34px] leading-[1] font-semibold tracking-tighter tabular-nums ${toneClass}`}>{value}</div>
      {sub ? <div className="text-xs text-dim mt-auto">{sub}</div> : null}
      {spark?.length ? (
        <div className={`absolute right-4 bottom-4 ${toneClass} opacity-80`}>
          <Sparkline values={spark} width={84} height={24} strokeWidth={1.4} />
        </div>
      ) : null}
    </div>
  );
}
