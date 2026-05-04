import { AutoRefresh } from "../../components/AutoRefresh";
import { SectionHeader } from "../../components/SectionHeader";
import { TelegramButton } from "../../components/TelegramButton";
import { getLiveSnapshot } from "../../lib/live-mantle";

export const dynamic = "force-dynamic";
export const revalidate = 30;

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
      <div className="max-w-page mx-auto px-6 py-20">
        <h1 className="text-display-md font-semibold text-ink">Mantle RPC unreachable</h1>
        <p className="text-sm text-dim mt-4 max-w-prose">{String(err)}</p>
      </div>
    );
  }

  const wallets = snap.topMovers;
  const maxFlow = Math.max(1, ...wallets.map((w) => w.inflowUsd + w.outflowUsd));
  const labeledCount = wallets.filter((w) => w.label).length;
  const totalFlow = wallets.reduce((acc, w) => acc + w.inflowUsd + w.outflowUsd, 0);

  return (
    <>
      <AutoRefresh ms={30_000} />
      <section className="border-b border-line">
        <div className="max-w-page mx-auto px-6 pt-12 md:pt-16 pb-10 grid lg:grid-cols-[1.5fr_1fr] gap-10 items-end">
          <div>
            <div className="eyebrow mb-3">Live · last {Math.round(snap.windowSec / 60)}m on Mantle</div>
            <h1 className="text-display-md font-semibold text-ink">
              The wallets actually <span className="text-accent">moving Mantle</span>.
            </h1>
            <p className="text-[16px] text-ink-2 mt-5 max-w-2xl leading-[1.55]">
              Ranked by total flow this window. Labels feed every alert narrative — extending the seed list is
              the highest-ROI thing for narrative quality. Click any address to open it on Mantlescan.
            </p>
            <div className="mt-6">
              <TelegramButton size="md" label="Track in Telegram" />
            </div>
          </div>
          <aside className="border-l-0 lg:border-l border-line lg:pl-10 grid grid-cols-2 gap-y-5 text-sm">
            <Stat k="Wallets" v={wallets.length.toString()} />
            <Stat k="Labeled" v={labeledCount.toString()} tone={labeledCount === 0 ? "warn" : "up"} />
            <Stat k="Total flow" v={fmtUsd(totalFlow, 1)} tone="up" />
            <Stat k="Block" v={snap.blockNumber.toLocaleString()} />
          </aside>
        </div>
      </section>

      <div className="max-w-page mx-auto px-6 py-12">
        <SectionHeader
          eyebrow="Leaderboard"
          title={`Top movers · last ${Math.round(snap.windowSec / 60)} minutes`}
          description="Bars compare each wallet to the top mover. Inflow and outflow split shows direction at a glance."
          meta={`${wallets.length} wallets`}
        />
        <div className="border border-line bg-paper">
          <div className="grid grid-cols-[44px_2fr_1.2fr_120px_120px_120px_180px] gap-3 px-5 py-3 eyebrow border-b border-line">
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
            const inflowPct = total > 0 ? (w.inflowUsd / total) * 100 : 50;
            return (
              <a
                key={w.address}
                href={`https://mantlescan.xyz/address/${w.address}`}
                target="_blank"
                rel="noreferrer"
                className="grid grid-cols-[44px_2fr_1.2fr_120px_120px_120px_180px] gap-3 px-5 py-3 items-center text-sm border-b border-line last:border-b-0 row-hover"
              >
                <span className="text-dim text-xs tabular-nums">{(i + 1).toString().padStart(2, "0")}</span>
                <span className="font-mono text-xs text-ink">{shortAddr(w.address)}</span>
                <span>
                  {w.label ? (
                    <span className="inline-block bg-accent-soft text-accent px-2 py-0.5 text-[10px] uppercase tracking-widest font-semibold">
                      {w.label}
                    </span>
                  ) : (
                    <span className="text-dim text-xs">unlabeled · {w.topToken}</span>
                  )}
                </span>
                <span className="text-right tabular-nums text-accent">{fmtUsd(w.inflowUsd, 1)}</span>
                <span className="text-right tabular-nums text-red">{fmtUsd(w.outflowUsd, 1)}</span>
                <span className={`text-right tabular-nums ${netTone}`}>{fmtUsd(w.netUsd, 1)}</span>
                <span className="flex items-center gap-2">
                  <span className="flex-1 h-2 bg-line-2 relative">
                    <span
                      className="absolute inset-y-0 left-0 bg-accent"
                      style={{ width: `${Math.max(2, (inflowPct / 100) * pct)}%` }}
                    />
                    <span
                      className="absolute inset-y-0 bg-red"
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
            <div className="px-5 py-12 text-sm text-dim text-center">
              No wallet activity in the live window. The chain is quiet right now — try refreshing in 30s.
            </div>
          ) : null}
        </div>

        <div className="mt-5 text-xs text-dim flex flex-wrap gap-x-6 gap-y-2">
          <span className="inline-flex items-center gap-2">
            <span className="w-2 h-2 bg-accent inline-block" /> inflow
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-2 h-2 bg-red inline-block" /> outflow
          </span>
          <span>· bar width = relative to top mover</span>
          <span>· labels seed: <code>src/indexer/labels.ts</code></span>
        </div>
      </div>
    </>
  );
}

function Stat({ k, v, tone }: { k: string; v: string; tone?: "up" | "warn" | "down" }) {
  const c = tone === "up" ? "text-accent" : tone === "warn" ? "text-warn" : tone === "down" ? "text-red" : "text-ink";
  return (
    <div>
      <div className="eyebrow text-[10px] mb-1">{k}</div>
      <div className={`tabular-nums text-[18px] tracking-tighter font-semibold ${c}`}>{v}</div>
    </div>
  );
}
