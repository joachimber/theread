import { Sparkline } from "./Sparkline";

interface HeroAlertProps {
  kind: string;
  token: string;
  headline: string;
  narrative: string;
  txUrl: string | null;
  ago: string;
  spark: number[];
  pct?: number;
}

export function HeroAlert({ kind, token, headline, narrative, txUrl, ago, spark, pct }: HeroAlertProps) {
  const tone = (pct ?? 0) > 0 ? "text-accent" : (pct ?? 0) < 0 ? "text-red" : "text-ink";

  return (
    <article className="border border-line bg-panel relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{
        backgroundImage:
          "linear-gradient(to right, #00ff88 1px, transparent 1px), linear-gradient(to bottom, #00ff88 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }} />
      <div className="relative grid lg:grid-cols-[1fr_280px] gap-0">
        <div className="p-7 md:p-9 border-b lg:border-b-0 lg:border-r border-line">
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-dim mb-5">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-accent animate-pulse inline-block" />
              <span className="text-accent">live</span>
            </span>
            <span>·</span>
            <span>{kind.replace("_", " ")}</span>
            <span>·</span>
            <span>{token}</span>
            <span>·</span>
            <span>{ago}</span>
          </div>
          <h2 className={`text-3xl md:text-[42px] leading-[1.1] tracking-tight font-semibold mb-4 ${tone}`}>
            {headline}
          </h2>
          <p className="text-base md:text-lg text-ink/90 leading-relaxed max-w-2xl">{narrative}</p>
          <div className="mt-6 flex items-center gap-5 text-xs text-dim">
            {txUrl ? (
              <a href={txUrl} target="_blank" rel="noreferrer" className="hover:text-accent inline-flex items-center gap-1">
                view on mantlescan ↗
              </a>
            ) : null}
            <span>narrated by Claude · attested ERC-8004</span>
          </div>
        </div>
        <div className="p-7 md:p-9 flex flex-col justify-between gap-6 bg-bg/40">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-dim mb-3">Window flow</div>
            <div className={`${tone}`}>
              <Sparkline values={spark.length ? spark : [0]} width={216} height={56} strokeWidth={1.5} stroke="currentColor" fill="currentColor" />
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-dim mb-1">Move</div>
            <div className={`text-3xl font-semibold tabular-nums ${tone}`}>
              {pct !== undefined ? `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%` : "—"}
            </div>
            <div className="text-xs text-dim mt-1">past 24 hours</div>
          </div>
        </div>
      </div>
    </article>
  );
}
