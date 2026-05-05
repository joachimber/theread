import { StatBlock } from "../components/StatBlock";
import { HeroAlert } from "../components/HeroAlert";
import { Marquee } from "../components/Marquee";
import { AlertCard } from "../components/AlertCard";
import { TokenBoard } from "../components/TokenBoard";
import { AutoRefresh } from "../components/AutoRefresh";
import { LiveDot } from "../components/LiveDot";
import { TelegramButton } from "../components/TelegramButton";
import { SectionHeader } from "../components/SectionHeader";
import { HowItWorks } from "../components/HowItWorks";
import { BuiltOn } from "../components/BuiltOn";
import { CTABanner } from "../components/CTABanner";
import { MindshareStrip } from "../components/MindshareStrip";
import { AvailableOnVirtuals } from "../components/AvailableOnVirtuals";
import { Receipts } from "../components/Receipts";
import {
  getLiveSnapshot,
  type LiveAlert,
  type WalletMover,
  type ParsedTransfer,
} from "../lib/live-mantle";
import { getReadOfTheDay } from "../lib/queries";
import { ReadOfTheDay } from "../components/ReadOfTheDay";

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
    return <ErrorState err={String(err)} />;
  }

  const readOfTheDay = await getReadOfTheDay().catch(() => null);
  const hero = snap.alerts[0];
  const rest = snap.alerts.slice(1, 7);
  const totalVolume = snap.topByToken.reduce((acc, t) => acc + t.volumeUsd, 0);
  const topMover = snap.topByToken[0];

  return (
    <>
      <AutoRefresh ms={30_000} />
      <Marquee
        items={snap.topByToken.map((t) => ({
          symbol: t.symbol,
          priceUsd: t.priceUsd,
          change24h: t.change24h,
        }))}
        blockNumber={snap.blockNumber}
      />

      {/* HERO */}
      <section className="border-b border-line">
        <div className="max-w-page mx-auto px-4 md:px-6 pt-10 md:pt-20 pb-10 md:pb-20 grid lg:grid-cols-[1.5fr_1fr] gap-10 lg:gap-14 items-end">
          <div>
            <div className="flex items-center gap-3 mb-5 md:mb-7 flex-wrap">
              <span className="eyebrow">Track 2 · AI Alpha &amp; Data</span>
              <span className="text-line">/</span>
              <LiveDot lastTs={snap.blockTs.getTime()} />
            </div>
            <h1 className="text-[clamp(36px,7vw,96px)] leading-[0.98] tracking-tightest font-semibold text-ink text-balance">
              Every Mantle move, <span className="text-accent">in one sentence.</span>
            </h1>
            <p className="text-[15px] md:text-[20px] text-ink-2 mt-5 md:mt-7 max-w-2xl leading-[1.55]">
              The Read is an autonomous agent that watches Mantle 24/7. It calls out price spikes, volume
              anomalies, and whale flows the moment they happen, names the wallets behind them, and pins each
              alert hash on-chain via an ERC-8004 agent identity NFT.
            </p>
            <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-6 md:mt-9">
              <TelegramButton size="lg" label="Open in Telegram · free" />
              <a
                href="https://app.virtuals.io/acp"
                target="_blank"
                rel="noreferrer"
                className="btn-ghost text-sm"
              >
                Hire as an agent on Virtuals ↗
              </a>
            </div>
            <p className="mt-3 text-[12px] text-dim">
              Hourly market wraps · daily editor&apos;s pick at 00:00 UTC · real-time push for sev-5
              events · per-call USDC for agents.{" "}
              <a href="#feed" className="link">See live feed ↓</a>
            </p>
          </div>
          <aside className="border-t lg:border-t-0 lg:border-l border-line pt-7 lg:pt-0 lg:pl-10">
            <div className="grid grid-cols-2 gap-y-4 md:gap-y-5 text-sm">
              <Lookup k="Block" v={snap.blockNumber.toLocaleString()} />
              <Lookup k="Transfers · past 8 min" v={snap.transfers.length.toLocaleString()} />
              <Lookup k="Active wallets" v={snap.walletCount.toLocaleString()} />
              <Lookup k="USD flow · past 8 min" v={fmtUsd(totalVolume, 1)} tone="up" />
              <Lookup k="Live alerts" v={snap.alerts.length.toString()} tone="up" />
              <Lookup k="Agent" v="ERC-8004 #1" />
            </div>
            <div className="mt-6 md:mt-7 pt-4 md:pt-5 border-t border-line text-[12px] text-dim leading-relaxed">
              Each render pulls the last 250 Mantle blocks (~8 minutes at 2s/block) directly from the public RPC.
              Snapshot cached 60s; page re-fetches every 30s.
            </div>
          </aside>
        </div>
      </section>

      <div id="feed" className="max-w-page mx-auto px-4 md:px-6 pt-10 md:pt-20 pb-16 md:pb-24 flex flex-col gap-12 md:gap-16">
        {/* READ OF THE DAY — pinned editor's pick */}
        {readOfTheDay ? (
          <section>
            <SectionHeader
              eyebrow="The Read · today's edition"
              title="One curated story per day"
              description="Selected from the past 24 hours by composite score (severity × USD). Posted to Telegram at 00:00 UTC and pinned on-chain via ERC-8004."
              meta="daily digest"
            />
            <ReadOfTheDay alert={readOfTheDay} />
          </section>
        ) : null}

        {/* SPOTLIGHT — live window */}
        {hero ? (
          <section>
            <SectionHeader
              eyebrow="Spotlight · live"
              title="What's happening right now"
              description="Highest-severity alert in the past 8 minutes. Same payload that ships to Telegram in real time."
              meta={`block ${snap.blockNumber.toLocaleString()}`}
            />
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
              usd={hero.usd}
              blockNumber={snap.blockNumber}
            />
          </section>
        ) : null}

        {/* STATS BENTO */}
        <section className="grid grid-cols-2 md:grid-cols-4 border-l border-t border-line bg-paper">
          <StatBlock
            label="USD flow · past 8 min"
            value={fmtUsd(totalVolume, 1)}
            sub={`${snap.transfers.length} ERC-20 transfers · ~${Math.round(snap.windowSec / 60)} min`}
            spark={topMover?.spark}
            tone="up"
          />
          <StatBlock
            label="Active wallets · past 8 min"
            value={snap.walletCount.toLocaleString()}
            sub="distinct addresses sending or receiving"
          />
          <StatBlock
            label="Live alerts"
            value={snap.alerts.length.toString()}
            sub={(() => {
              const w = snap.alerts.filter((a) => a.kind === "whale_move").length;
              const p = snap.alerts.filter((a) => a.kind === "price_spike").length;
              const v = snap.alerts.filter((a) => a.kind === "volume_spike").length;
              const parts = [
                w ? `${w} whale` : null,
                p ? `${p} price` : null,
                v ? `${v} flow` : null,
              ].filter(Boolean);
              return parts.length ? parts.join(" · ") : "current window";
            })()}
            tone="warn"
          />
          <StatBlock label="Agent identity" value="ERC-8004" sub="The Read · #1" />
        </section>

        {/* RECENT ALERTS */}
        <section>
          <SectionHeader
            eyebrow="Recent alerts"
            title="What the agent is saying right now"
            description="Each card is a one-sentence read written by Z.ai's GLM-4.7 Flash from structured detector output. Wallets are referenced by label, never raw address."
            meta={`${rest.length + (hero ? 1 : 0)} active`}
          />
          {rest.length === 0 && !hero ? (
            <div className="border border-line bg-paper p-10 text-sm text-dim text-center">
              No anomalies in the current window. The detector is patient — most blocks pass without comment.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-t border-line bg-paper">
              {rest.map((a: LiveAlert) => (
                <AlertCard
                  key={a.id}
                  a={{
                    ...a,
                    spark: snap.topByToken.find((t) => t.symbol === a.token)?.spark ?? [],
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* TOKENS + MOVERS */}
        <section className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-10">
          <div>
            <SectionHeader
              eyebrow={`Tokens · past ${Math.round(snap.windowSec / 60)} min`}
              title="Where flow is happening on Mantle"
              description="Each row's sparkline is USD transfer volume bucketed within the 8-minute window. Spot price + 24h change via Coingecko."
              meta={`${snap.topByToken.length} watched`}
            />
            <TokenBoard rows={snap.topByToken} />
          </div>
          <div>
            <SectionHeader
              eyebrow="Top wallets · past 8 min"
              title="Who's moving the most"
              description="Ranked by total USD flow in the window. Click any address to research it on Nansen — labels there feed every alert narrative."
              meta={`${snap.topMovers.length} ranked`}
            />
            <div className="border border-line bg-paper">
              {snap.topMovers.slice(0, 10).map((m: WalletMover, i) => (
                <div
                  key={m.address}
                  className="grid grid-cols-[28px_1fr_92px_72px] gap-3 px-5 py-3 items-center text-sm border-b border-line last:border-b-0 row-hover"
                >
                  <span className="text-dim text-xs tabular-nums">{(i + 1).toString().padStart(2, "0")}</span>
                  <a
                    href={`https://app.nansen.ai/profiler/${m.address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col gap-0.5 min-w-0 hover:text-accent"
                  >
                    <span className="font-mono text-xs text-ink">{shortAddr(m.address)}</span>
                    {m.label ? (
                      <span className="eyebrow text-accent">{m.label}</span>
                    ) : (
                      <span className="eyebrow text-dim">unlabeled · {m.topToken}</span>
                    )}
                  </a>
                  <span className="text-right tabular-nums text-ink">{fmtUsd(m.inflowUsd + m.outflowUsd, 1)}</span>
                  <span className="text-right text-xs">
                    <a
                      href={`https://app.nansen.ai/profiler/${m.address}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-dim hover:text-accent"
                    >
                      Nansen ↗
                    </a>
                  </span>
                </div>
              ))}
              {snap.topMovers.length === 0 ? (
                <div className="px-5 py-10 text-sm text-dim text-center">
                  No wallet activity in this window.
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {/* RAW TRANSFERS */}
        {snap.transfers.length > 0 ? (
          <section>
            <SectionHeader
              eyebrow="Largest transfers · raw chain"
              title="Decoded ERC-20 logs"
              description={`Pulled directly off Mantle's public RPC across the past ${Math.round(snap.windowSec / 60)} minutes (~${250} blocks). No database in the loop — every number on this row is decoded on render.`}
              meta={`${snap.transfers.length} parsed`}
            />
            <div className="border border-line bg-paper table-scroll">
              <div className="min-w-[820px]">
              <div className="grid grid-cols-[60px_1fr_1fr_110px_120px_160px] gap-3 px-4 md:px-5 py-2.5 eyebrow border-b border-line">
                <div>Token</div>
                <div>From · click for Nansen</div>
                <div>To · click for Nansen</div>
                <div className="text-right">USD</div>
                <div className="text-right">Block · Age</div>
                <div className="text-right">Tx</div>
              </div>
              {snap.transfers.slice(0, 12).map((t: ParsedTransfer) => (
                <div
                  key={`${t.txHash}-${t.logIndex}`}
                  className="grid grid-cols-[60px_1fr_1fr_110px_120px_160px] gap-3 px-4 md:px-5 py-3 items-center text-sm border-b border-line last:border-b-0 row-hover"
                >
                  <span className="font-medium tracking-tighter">{t.symbol}</span>
                  <a
                    href={`https://app.nansen.ai/profiler/${t.fromAddr}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs truncate text-ink-2 hover:text-accent"
                    title="Inspect sender on Nansen"
                  >
                    {shortAddr(t.fromAddr)}
                  </a>
                  <a
                    href={`https://app.nansen.ai/profiler/${t.toAddr}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs truncate text-ink-2 hover:text-accent"
                    title="Inspect receiver on Nansen"
                  >
                    {shortAddr(t.toAddr)}
                  </a>
                  <span className="text-right tabular-nums">
                    {fmtUsd(t.usdValue, t.usdValue >= 1000 ? 1 : 0)}
                  </span>
                  <span className="text-right tabular-nums text-dim text-xs">
                    {t.blockNumber.toLocaleString()} · {relTime(t.ts)}
                  </span>
                  <span className="text-right text-xs flex justify-end gap-3">
                    <a
                      href={`https://mantlescan.xyz/tx/${t.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-dim hover:text-accent"
                    >
                      tx ↗
                    </a>
                  </span>
                </div>
              ))}
              </div>
            </div>
          </section>
        ) : null}

        <section>
          <SectionHeader
            eyebrow="Mindshare layer"
            title="Where social attention meets on-chain flow"
            description="Pulled from Elfa AI's social signal API. The cross-reference is what catches narrative-driven moves before the chain does."
            meta="powered by Elfa AI"
          />
          <MindshareStrip />
        </section>

        <HowItWorks />
        <Receipts />
        <AvailableOnVirtuals />
        <BuiltOn />
        <CTABanner />
      </div>
    </>
  );
}

function Lookup({ k, v, tone }: { k: string; v: string; tone?: "up" | "down" }) {
  const c = tone === "up" ? "text-accent" : tone === "down" ? "text-red" : "text-ink";
  return (
    <div>
      <div className="eyebrow text-[10px] mb-1">{k}</div>
      <div className={`tabular-nums text-[19px] tracking-tighter font-semibold ${c}`}>{v}</div>
    </div>
  );
}

function ErrorState({ err }: { err: string }) {
  return (
    <div className="max-w-page mx-auto px-6 py-20">
      <div className="eyebrow mb-3">Boot error</div>
      <h1 className="text-display-md font-semibold text-ink">Mantle RPC unreachable</h1>
      <p className="text-[16px] text-ink-2 mt-4 max-w-prose leading-relaxed">
        The dashboard pulls live transfers + Coingecko prices on render. Either Mantle&apos;s public RPC is
        rate-limiting you, or your network is blocking it. Set <code>MANTLE_RPC_URL</code> in <code>.env</code>{" "}
        to a paid Alchemy / QuickNode endpoint and refresh.
      </p>
      <pre className="text-xs text-dim mt-6 whitespace-pre-wrap">{err}</pre>
    </div>
  );
}
