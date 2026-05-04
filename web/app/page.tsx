import { StatBlock } from "../components/StatBlock";
import { HeroAlert } from "../components/HeroAlert";
import { Marquee } from "../components/Marquee";
import { AlertCard } from "../components/AlertCard";
import { TokenBoard } from "../components/TokenBoard";
import { AutoRefresh } from "../components/AutoRefresh";
import { LiveDot } from "../components/LiveDot";
import { getLiveSnapshot, isLiveDemoMode, type LiveAlert, type WalletMover, type ParsedTransfer } from "../lib/live-mantle";

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
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function relTime(d: Date): string {
  const s = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${Math.round(s)}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  return `${Math.round(s / 3600)}h`;
}

export default async function HomePage() {
  let snap;
  try {
    snap = await getLiveSnapshot();
  } catch (err) {
    return (
      <div className="max-w-page mx-auto px-6 py-16">
        <h1 className="text-3xl font-semibold mb-3">Mantle RPC unreachable</h1>
        <p className="text-sm text-dim max-w-prose">
          The dashboard pulls live transfers + Coingecko prices on render. Either Mantle&apos;s public RPC is rate-limiting you,
          or your network is blocking it. Set <code className="text-ink">MANTLE_RPC_URL</code> in <code className="text-ink">.env</code>{" "}
          to a paid Alchemy / QuickNode endpoint and refresh.
        </p>
        <pre className="text-xs text-dim mt-4 whitespace-pre-wrap">{String(err)}</pre>
      </div>
    );
  }

  const hero = snap.alerts[0];
  const rest = snap.alerts.slice(1, 7);
  const totalVolume = snap.topByToken.reduce((acc, t) => acc + t.volumeUsd, 0);
  const topMover = snap.topByToken[0];
  const labeledMovers = snap.topMovers.filter((m) => m.label).slice(0, 4);

  return (
    <>
      <AutoRefresh ms={15_000} />
      <Marquee
        items={snap.topByToken.map((t) => ({ symbol: t.symbol, priceUsd: t.priceUsd, change24h: t.change24h }))}
        blockNumber={snap.blockNumber}
      />

      <div className="max-w-page mx-auto px-6 pt-10 pb-20">
        <div className="flex items-end justify-between mb-7 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[10px] uppercase tracking-[0.25em] text-dim">Track 2 / AI Alpha & Data</span>
              <span className="text-line">·</span>
              <LiveDot lastTs={snap.blockTs.getTime()} />
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tightest leading-[1.05]">
              Every Mantle move,
              <br />
              <span className="text-accent">explained in one sentence.</span>
            </h1>
            <p className="text-sm text-dim mt-4 max-w-xl leading-relaxed">
              The Read watches Mantle 24/7. It scans the chain for unusual price moves, volume spikes,
              and whale flows, names the wallets behind them, and pins each alert hash on-chain via an
              ERC-8004 agent identity NFT.
            </p>
          </div>
          <div className="hidden md:flex flex-col items-end gap-1 text-xs text-dim">
            <span className="font-mono text-ink tabular-nums">block {snap.blockNumber.toLocaleString()}</span>
            <span>last {snap.windowSec}s</span>
            <span>{snap.transfers.length.toLocaleString()} transfers · {snap.walletCount.toLocaleString()} wallets</span>
          </div>
        </div>

        {hero ? (
          <div className="mb-6">
            <HeroAlert
              kind={hero.kind}
              token={hero.token}
              headline={hero.headline}
              narrative={hero.narrative}
              txUrl={hero.txUrl}
              ago={hero.ago}
              spark={
                snap.topByToken.find((t) => t.symbol === hero.token)?.spark ??
                snap.topByToken[0]?.spark ?? []
              }
              pct={hero.pct}
            />
          </div>
        ) : null}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-line mb-12">
          <StatBlock
            label="Window flow"
            value={fmtUsd(totalVolume, 1)}
            sub={`${snap.transfers.length} transfers · last ${Math.round(snap.windowSec / 60)}m`}
            spark={topMover?.spark}
            tone="up"
          />
          <StatBlock
            label="Active wallets"
            value={snap.walletCount.toLocaleString()}
            sub={`${labeledMovers.length} labeled entities active`}
          />
          <StatBlock
            label="Live alerts"
            value={snap.alerts.length.toString()}
            sub={`${snap.alerts.filter((a) => a.kind === "whale_move").length} whale · ${snap.alerts.filter((a) => a.kind === "price_spike").length} price · ${snap.alerts.filter((a) => a.kind === "volume_spike").length} flow`}
            tone="warn"
          />
          <StatBlock
            label="Agent identity"
            value="ERC-8004"
            sub="The Read · attestations on Mantle"
          />
        </div>

        {/* ALERTS — full width, 3-up grid */}
        <section className="mb-12">
          <div className="flex items-end justify-between mb-4 border-b border-line pb-3">
            <div>
              <h2 className="text-xs uppercase tracking-[0.2em] text-dim">Recent alerts</h2>
              <p className="text-[11px] text-dim mt-1">Narrated by Claude · attested via ERC-8004</p>
            </div>
            <span className="text-xs text-dim tabular-nums">{rest.length + (hero ? 1 : 0)} active</span>
          </div>
          {rest.length === 0 && !hero ? (
            <EmptyAlerts />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-line">
              {rest.map((a: LiveAlert) => (
                <AlertCard
                  key={a.id}
                  a={{
                    ...a,
                    spark:
                      snap.topByToken.find((t) => t.symbol === a.token)?.spark ?? [],
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* TOKENS + MOVERS — side by side, full width */}
        <section className="mb-12 grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-px bg-line">
          <div className="bg-bg p-0">
            <div className="flex items-end justify-between mb-3 px-1 pb-3 border-b border-line">
              <div>
                <h2 className="text-xs uppercase tracking-[0.2em] text-dim">Tokens · last {Math.round(snap.windowSec / 60)}m</h2>
                <p className="text-[11px] text-dim mt-1">Sparklines = volume per ~30s bucket within the window</p>
              </div>
              <span className="text-xs text-dim">{snap.topByToken.length} watched</span>
            </div>
            <TokenBoard rows={snap.topByToken} />
          </div>
          <div className="bg-bg p-0">
            <div className="flex items-end justify-between mb-3 px-1 pb-3 border-b border-line">
              <div>
                <h2 className="text-xs uppercase tracking-[0.2em] text-dim">Top wallet movers</h2>
                <p className="text-[11px] text-dim mt-1">Ranked by total flow · click to view on Mantlescan</p>
              </div>
              <span className="text-xs text-dim">{snap.topMovers.length} ranked</span>
            </div>
            <div className="border border-line">
              {snap.topMovers.slice(0, 9).map((m: WalletMover, i) => (
                <a
                  key={m.address}
                  href={`https://mantlescan.xyz/address/${m.address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="grid grid-cols-[28px_1fr_84px] gap-3 px-4 py-2.5 items-center text-sm border-b border-line last:border-b-0 row-hover"
                >
                  <span className="text-dim text-xs tabular-nums">{(i + 1).toString().padStart(2, "0")}</span>
                  <span className="flex flex-col gap-0.5 min-w-0">
                    <span className="font-mono text-xs truncate">{shortAddr(m.address)}</span>
                    {m.label ? (
                      <span className="text-[10px] uppercase tracking-widest text-accent">{m.label}</span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-widest text-dim">unlabeled · {m.topToken}</span>
                    )}
                  </span>
                  <span className="text-right tabular-nums">{fmtUsd(m.inflowUsd + m.outflowUsd, 1)}</span>
                </a>
              ))}
              {snap.topMovers.length === 0 ? (
                <div className="px-4 py-8 text-sm text-dim text-center">
                  No wallet activity in this window.
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {/* RECENT TRANSFERS — proof of real chain data */}
        {snap.transfers.length > 0 ? (
          <section className="mb-12">
            <div className="flex items-end justify-between mb-3 border-b border-line pb-3">
              <div>
                <h2 className="text-xs uppercase tracking-[0.2em] text-dim">Largest transfers · raw chain</h2>
                <p className="text-[11px] text-dim mt-1">Decoded ERC-20 Transfer logs from the most recent {Math.round(snap.windowSec / 60)} minutes on Mantle</p>
              </div>
              <span className="text-xs text-dim">{snap.transfers.length} parsed</span>
            </div>
            <div className="border border-line">
              <div className="grid grid-cols-[80px_1fr_1fr_120px_120px] gap-3 px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] text-dim border-b border-line bg-panel/60">
                <div>Token</div>
                <div>From</div>
                <div>To</div>
                <div className="text-right">USD</div>
                <div className="text-right">Block · Age</div>
              </div>
              {snap.transfers.slice(0, 10).map((t: ParsedTransfer) => (
                <a
                  key={t.txHash}
                  href={`https://mantlescan.xyz/tx/${t.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="grid grid-cols-[80px_1fr_1fr_120px_120px] gap-3 px-4 py-3 items-center text-sm border-b border-line last:border-b-0 row-hover"
                >
                  <span className="text-[11px] uppercase tracking-widest">{t.symbol}</span>
                  <span className="font-mono text-xs truncate">{shortAddr(t.fromAddr)}</span>
                  <span className="font-mono text-xs truncate">{shortAddr(t.toAddr)}</span>
                  <span className="text-right tabular-nums">{fmtUsd(t.usdValue, t.usdValue >= 1000 ? 1 : 0)}</span>
                  <span className="text-right tabular-nums text-dim text-xs">
                    {t.blockNumber.toLocaleString()} · {relTime(t.ts)}
                  </span>
                </a>
              ))}
            </div>
          </section>
        ) : null}

        {isLiveDemoMode() ? (
          <div className="border border-accent/30 bg-accent/[0.04] p-5 text-xs text-dim leading-relaxed flex items-start gap-4">
            <span className="text-accent uppercase tracking-[0.2em] text-[10px] font-semibold pt-0.5">live demo</span>
            <p className="flex-1">
              Every number on this page comes from Mantle&apos;s public RPC + Coingecko on each refresh — no database, no precomputed
              data. Connect <code className="text-ink">DATABASE_URL</code> to switch to the indexed warehouse view (24h windows,
              long-tail wallet labels, ERC-8004 attestations posted on every alert).
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}

function EmptyAlerts() {
  return (
    <div className="border border-line p-8 text-sm text-dim text-center">
      No anomalies in the current window. The detector is patient — most blocks pass without comment.
    </div>
  );
}
