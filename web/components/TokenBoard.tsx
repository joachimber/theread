import { Sparkline } from "./Sparkline";

interface Row {
  symbol: string;
  priceUsd: number | null;
  change24h: number | null;
  volumeUsd: number;
  transfers: number;
  spark: number[];
}

function fmtUsd(n: number, prec = 2): string {
  const a = Math.abs(n);
  if (a >= 1e9) return `$${(n / 1e9).toFixed(prec)}B`;
  if (a >= 1e6) return `$${(n / 1e6).toFixed(prec)}M`;
  if (a >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function fmtPrice(n: number | null): string {
  if (n === null) return "—";
  if (n < 1) return `$${n.toFixed(4)}`;
  if (n < 100) return `$${n.toFixed(2)}`;
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function TokenBoard({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return <div className="text-sm text-dim p-5 border border-line bg-paper">No token activity in the window.</div>;
  }
  return (
    <div className="border border-line bg-paper table-scroll">
      <div className="min-w-[560px]">
        <div className="grid grid-cols-[1fr_104px_84px_1.2fr_72px] gap-3 px-4 md:px-5 py-3 eyebrow border-b border-line">
          <div>Token</div>
          <div className="text-right">Price</div>
          <div className="text-right">24h</div>
          <div>Flow · 8m</div>
          <div className="text-right">Tx</div>
        </div>
        {rows.map((r) => {
          const tone = (r.change24h ?? 0) >= 0 ? "text-accent" : "text-red";
          return (
            <div
              key={r.symbol}
              className="grid grid-cols-[1fr_104px_84px_1.2fr_72px] gap-3 px-4 md:px-5 py-3.5 text-sm items-center border-b border-line last:border-b-0 row-hover"
            >
              <div className="font-medium tracking-tighter text-[15px]">{r.symbol}</div>
              <div className="text-right tabular-nums">{fmtPrice(r.priceUsd)}</div>
              <div className={`text-right tabular-nums text-xs ${tone}`}>
                {r.change24h !== null
                  ? `${(r.change24h ?? 0) >= 0 ? "+" : ""}${r.change24h.toFixed(2)}%`
                  : "—"}
              </div>
              <div className="flex items-center gap-3 text-dim">
                <div className={tone}>
                  <Sparkline values={r.spark} width={88} height={20} fill="currentColor" />
                </div>
                <span className="tabular-nums text-xs text-ink-2">{fmtUsd(r.volumeUsd, 1)}</span>
              </div>
              <div className="text-right tabular-nums text-dim text-xs">{r.transfers.toLocaleString()}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
