import { AutoRefresh } from "../../components/AutoRefresh";
import { getLiveSnapshot } from "../../lib/live-mantle";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function fmtUsd(n: number, prec = 2): string {
  const a = Math.abs(n);
  if (a >= 1e9) return `$${(n / 1e9).toFixed(prec)}B`;
  if (a >= 1e6) return `$${(n / 1e6).toFixed(prec)}M`;
  if (a >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function shortAddr(a: string): string {
  return `${a.slice(0, 8)}…${a.slice(-6)}`;
}

export default async function WalletsPage() {
  let snap;
  try {
    snap = await getLiveSnapshot();
  } catch (err) {
    return (
      <div className="max-w-page mx-auto px-6 py-16">
        <h1 className="text-3xl font-semibold mb-3">Mantle RPC unreachable</h1>
        <p className="text-sm text-dim">{String(err)}</p>
      </div>
    );
  }

  const wallets = snap.topMovers;
  const maxFlow = Math.max(1, ...wallets.map((w) => w.inflowUsd + w.outflowUsd));
  const labeledCount = wallets.filter((w) => w.label).length;
  const totalFlow = wallets.reduce((acc, w) => acc + w.inflowUsd + w.outflowUsd, 0);

  return (
    <>
      <AutoRefresh ms={20_000} />
      <div className="max-w-page mx-auto px-6 pt-10 pb-20">
        <div className="flex items-end justify-between mb-7 gap-6">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-dim">Live · last {Math.round(snap.windowSec / 60)}m</span>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tightest leading-[1.05] mt-2">
              Top movers on <span className="text-accent">Mantle</span>
            </h1>
            <p className="text-sm text-dim mt-3 max-w-xl">
              Wallets ranked by total flow in the live window. Labels feed every alert narrative;
              extending the seed list is the highest-ROI thing for narrative quality.
            </p>
          </div>
          <div className="hidden md:flex flex-col items-end gap-1 text-xs text-dim">
            <span>{wallets.length} wallets · {labeledCount} labeled</span>
            <span className="font-mono text-ink tabular-nums">flow {fmtUsd(totalFlow, 1)}</span>
            <span>block {snap.blockNumber.toLocaleString()}</span>
          </div>
        </div>

        <div className="border border-line">
          <div className="grid grid-cols-[40px_1.5fr_1fr_120px_120px_120px_180px] gap-3 px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] text-dim border-b border-line bg-panel/60">
            <div>#</div>
            <div>Address</div>
            <div>Label</div>
            <div className="text-right">Inflow</div>
            <div className="text-right">Outflow</div>
            <div className="text-right">Net</div>
            <div>Activity</div>
          </div>
          {wallets.map((w, i) => {
            const total = w.inflowUsd + w.outflowUsd;
            const pct = (total / maxFlow) * 100;
            const netTone = w.netUsd > 0 ? "text-accent" : w.netUsd < 0 ? "text-red" : "text-ink";
            const inflowPct = total > 0 ? (w.inflowUsd / total) * 100 : 0;
            return (
              <a
                key={w.address}
                href={`https://mantlescan.xyz/address/${w.address}`}
                target="_blank"
                rel="noreferrer"
                className="grid grid-cols-[40px_1.5fr_1fr_120px_120px_120px_180px] gap-3 px-4 py-3 items-center text-sm border-b border-line last:border-b-0 row-hover"
              >
                <span className="text-dim text-xs tabular-nums">{(i + 1).toString().padStart(2, "0")}</span>
                <span className="font-mono text-xs">{shortAddr(w.address)}</span>
                <span>
                  {w.label ? (
                    <span className="inline-block border border-accent/40 text-accent px-2 py-0.5 text-[10px] uppercase tracking-widest">
                      {w.label}
                    </span>
                  ) : (
                    <span className="text-dim text-xs">unlabeled · {w.topToken}</span>
                  )}
                </span>
                <span className="text-right tabular-nums text-accent/90">{fmtUsd(w.inflowUsd, 1)}</span>
                <span className="text-right tabular-nums text-red/90">{fmtUsd(w.outflowUsd, 1)}</span>
                <span className={`text-right tabular-nums ${netTone}`}>{fmtUsd(w.netUsd, 1)}</span>
                <span className="flex items-center gap-2">
                  <span className="flex-1 h-2 bg-line relative">
                    <span
                      className="absolute inset-y-0 left-0 bg-accent/70"
                      style={{ width: `${Math.max(2, (inflowPct / 100) * pct)}%` }}
                    />
                    <span
                      className="absolute inset-y-0 bg-red/70"
                      style={{
                        left: `${Math.max(2, (inflowPct / 100) * pct)}%`,
                        width: `${Math.max(2, ((100 - inflowPct) / 100) * pct)}%`,
                      }}
                    />
                  </span>
                  <span className="text-[10px] tabular-nums text-dim w-9 text-right">{w.txCount}tx</span>
                </span>
              </a>
            );
          })}
          {wallets.length === 0 ? (
            <div className="px-4 py-12 text-sm text-dim text-center">
              No wallet activity in the live window. The chain is quiet right now — try refreshing in 30s.
            </div>
          ) : null}
        </div>

        <div className="mt-6 text-xs text-dim flex gap-6 flex-wrap">
          <span className="inline-flex items-center gap-2">
            <span className="w-2 h-2 bg-accent inline-block" /> inflow
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-2 h-2 bg-red inline-block" /> outflow
          </span>
          <span>· bar width = relative to top mover this window</span>
          <span>· labels seeded from <code className="text-ink">src/indexer/labels.ts</code></span>
        </div>
      </div>
    </>
  );
}
