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
  usd?: number;
  blockNumber?: number;
}

function fmtUsdShort(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export function HeroAlert({ kind, token, headline, narrative, txUrl, ago, spark, pct, usd }: HeroAlertProps) {
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
            <span>
              narrated by{" "}
              <a href="https://z.ai" target="_blank" rel="noreferrer" className="link">
                Z.ai GLM-5.1
              </a>
              {" "}via{" "}
              <a href="https://venice.ai" target="_blank" rel="noreferrer" className="link">
                Venice
              </a>
              {" "}· attested via ERC-8004
            </span>
          </div>
        </div>
        <div className="p-8 md:p-10 flex flex-col justify-between gap-7 bg-line-2/40">
          {kind === "price_spike" && pct !== undefined ? (
            <>
              <div>
                <div className="eyebrow mb-3">{token} flow · past 8 min</div>
                <div className={tone}>
                  <Sparkline values={spark.length ? spark : [0]} width={240} height={64} strokeWidth={1.6} fill="currentColor" />
                </div>
              </div>
              <div>
                <div className="eyebrow mb-2">Move · past 24 hours</div>
                <div className={`text-[44px] leading-none font-semibold tracking-tighter tabular-nums ${tone}`}>
                  {pct >= 0 ? "+" : ""}
                  {pct.toFixed(2)}%
                </div>
                <div className="text-xs text-dim mt-2">priced via Coingecko</div>
              </div>
            </>
          ) : kind === "whale_move" && usd !== undefined ? (
            <>
              <div>
                <div className="eyebrow mb-2">Transfer size</div>
                <div className="text-[44px] leading-none font-semibold tracking-tighter tabular-nums text-ink">
                  {fmtUsdShort(usd)}
                </div>
                <div className="text-xs text-dim mt-2">{token} · single Transfer log</div>
              </div>
              <div>
                <div className="eyebrow mb-3">{token} flow · past 8 min</div>
                <div className="text-ink">
                  <Sparkline values={spark.length ? spark : [0]} width={240} height={56} strokeWidth={1.6} fill="currentColor" />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="eyebrow mb-3">{token} flow · past 8 min</div>
                <div className="text-ink">
                  <Sparkline values={spark.length ? spark : [0]} width={240} height={64} strokeWidth={1.6} fill="currentColor" />
                </div>
              </div>
              <div className="text-xs text-dim">
                Sparkline = USD volume per ~30s bucket within the live window. Decoded straight from chain.
              </div>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
