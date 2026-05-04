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
    <article className="border border-line bg-paper relative overflow-hidden">
      <div className="grid lg:grid-cols-[1fr_320px] gap-0">
        <div className="p-8 md:p-10 border-b lg:border-b-0 lg:border-r border-line">
          <div className="flex items-center gap-3 eyebrow mb-6">
            <span className="inline-flex items-center gap-1.5 text-accent">
              <span className="w-1.5 h-1.5 bg-accent inline-block animate-pulse" />
              Live read
            </span>
            <span className="text-line">/</span>
            <span>{kind.replace("_", " ")}</span>
            <span className="text-line">/</span>
            <span>{token}</span>
            <span className="text-line">/</span>
            <span className="text-dim">{ago}</span>
          </div>
          <h2 className={`text-[clamp(28px,3.5vw,46px)] leading-[1.05] tracking-tighter font-semibold mb-5 ${tone}`}>
            {headline}
          </h2>
          <p className="text-[17px] md:text-[19px] text-ink-2 leading-[1.55] max-w-2xl">{narrative}</p>
          <div className="mt-7 flex items-center gap-5 text-xs text-dim">
            {txUrl ? (
              <a href={txUrl} target="_blank" rel="noreferrer" className="link inline-flex items-center gap-1">
                view on Mantlescan ↗
              </a>
            ) : null}
            <span>narrated by Claude · attested via ERC-8004</span>
          </div>
        </div>
        <div className="p-8 md:p-10 flex flex-col justify-between gap-7 bg-line-2/40">
          <div>
            <div className="eyebrow mb-3">Window flow</div>
            <div className={tone}>
              <Sparkline values={spark.length ? spark : [0]} width={240} height={64} strokeWidth={1.6} fill="currentColor" />
            </div>
          </div>
          <div>
            <div className="eyebrow mb-2">Move · 24h</div>
            <div className={`text-[44px] leading-none font-semibold tracking-tighter tabular-nums ${tone}`}>
              {pct !== undefined ? `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%` : "—"}
            </div>
            <div className="text-xs text-dim mt-2">priced via Coingecko, decoded from chain</div>
          </div>
        </div>
      </div>
    </article>
  );
}
