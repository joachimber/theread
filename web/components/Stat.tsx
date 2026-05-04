interface StatProps {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "up" | "down" | "warn";
}

export function Stat({ label, value, sub, tone = "default" }: StatProps) {
  const toneClass =
    tone === "up" ? "text-accent" : tone === "down" ? "text-red" : tone === "warn" ? "text-warn" : "text-ink";
  return (
    <div className="border border-line p-4 bg-panel">
      <div className="text-[10px] uppercase tracking-widest text-dim">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</div>
      {sub ? <div className="mt-1 text-xs text-dim">{sub}</div> : null}
    </div>
  );
}
