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
    return <div className="text-sm text-dim p-4 border border-line">No token activity in the window.</div>;
  }
  return (
    <div className="border border-line">
      <div className="grid grid-cols-[1fr_92px_72px_1fr_64px] gap-3 px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] text-dim border-b border-line bg-panel/60">
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
            className="grid grid-cols-[1fr_92px_72px_1fr_64px] gap-3 px-4 py-3 text-sm items-center border-b border-line last:border-b-0 row-hover"
          >
            <div className="font-medium tracking-tight">{r.symbol}</div>
            <div className="text-right tabular-nums">{fmtPrice(r.priceUsd)}</div>
            <div className={`text-right tabular-nums ${tone}`}>
              {r.change24h !== null
                ? `${(r.change24h ?? 0) >= 0 ? "+" : ""}${r.change24h.toFixed(2)}%`
                : "—"}
            </div>
            <div className="flex items-center gap-2.5 text-dim">
              <div className={tone}>
                <Sparkline values={r.spark} width={88} height={18} fill="currentColor" />
              </div>
              <span className="tabular-nums text-xs">{fmtUsd(r.volumeUsd, 1)}</span>
            </div>
            <div className="text-right tabular-nums text-dim text-xs">{r.transfers.toLocaleString()}</div>
          </div>
        );
      })}
    </div>
  );
}
