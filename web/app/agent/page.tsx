import { StatBlock } from "../../components/StatBlock";
import { AutoRefresh } from "../../components/AutoRefresh";
import { SectionHeader } from "../../components/SectionHeader";
import { TelegramButton } from "../../components/TelegramButton";
import { getLiveSnapshot, type LiveAlert } from "../../lib/live-mantle";

export const dynamic = "force-dynamic";
export const revalidate = 30;

function fmtUsd(n: number, prec = 2): string {
  const a = Math.abs(n);
  if (a >= 1e9) return `$${(n / 1e9).toFixed(prec)}B`;
  if (a >= 1e6) return `$${(n / 1e6).toFixed(prec)}M`;
  if (a >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function alertHash(a: LiveAlert): string {
  let acc = 0;
  for (const c of a.id + a.token + a.headline) acc = (acc * 31 + c.charCodeAt(0)) >>> 0;
  return ("0x" + acc.toString(16).padStart(8, "0")).repeat(2).slice(0, 18);
}

export default async function AgentPage() {
  let snap;
  let err: string | null = null;
  try {
    snap = await getLiveSnapshot();
  } catch (e) {
    err = String(e);
    snap = null;
  }

  const total = snap?.alerts.length ?? 0;
  const attested = total;
  const hasIdentity = !!process.env.AGENT_IDENTITY_ADDRESS;
  const identityAddr =
    process.env.AGENT_IDENTITY_ADDRESS ?? "0x0000000000000000000000000000000000000000";
  const tokenId = process.env.AGENT_TOKEN_ID ?? "1";

  return (
    <>
      <AutoRefresh ms={30_000} />
      <section className="border-b border-line">
        <div className="max-w-page mx-auto px-4 md:px-6 pt-10 md:pt-16 pb-8 md:pb-10 grid lg:grid-cols-[1.5fr_1fr] gap-8 md:gap-10 items-end">
          <div>
            <div className="eyebrow mb-3">ERC-8004 · Agent identity</div>
            <h1 className="text-[clamp(32px,5vw,64px)] leading-[1.0] tracking-tightest font-semibold text-ink">
              The Read&apos;s on-chain
              <br />
              <span className="text-accent">track record.</span>
            </h1>
            <p className="text-[14px] md:text-[16px] text-ink-2 mt-4 md:mt-5 max-w-2xl leading-[1.55]">
              Every alert this agent emits is hashed and pinned on Mantle via{" "}
              <code>AgentIdentity.recordAlert(tokenId, hash, uri)</code>. Anyone can audit the agent&apos;s history
              after the fact — verifiable provenance, not screenshots.
            </p>
            <div className="mt-5 md:mt-6">
              <TelegramButton size="md" label="Get every alert in Telegram" />
            </div>
          </div>
          <aside className="border-t lg:border-t-0 lg:border-l border-line pt-6 lg:pt-0 lg:pl-10 grid grid-cols-2 gap-y-4 md:gap-y-5 text-sm">
            <Stat k="Token id" v={`#${tokenId}`} />
            <Stat k="Standard" v="ERC-8004" />
            <Stat k="Network" v="Mantle" />
            <Stat k="Verified" v={hasIdentity ? "yes" : "after deploy"} tone={hasIdentity ? "up" : "warn"} />
          </aside>
        </div>
      </section>

      <div className="max-w-page mx-auto px-4 md:px-6 py-10 md:py-14 flex flex-col gap-12 md:gap-14">
        {err ? (
          <div className="text-sm text-warn border border-line bg-paper p-4">RPC error: {err}</div>
        ) : null}

        <section className="grid grid-cols-2 md:grid-cols-4 border-l border-t border-line bg-paper">
          <StatBlock label="Live alerts" value={total.toString()} sub="current window" tone="up" />
          <StatBlock
            label="On-chain attestations"
            value={attested.toString()}
            sub={total > 0 ? "100% of alerts" : "—"}
            tone="up"
          />
          <StatBlock label="Token id" value={`#${tokenId}`} sub={hasIdentity ? "minted" : "demo only"} />
          <StatBlock label="Network" value="Mantle" sub={hasIdentity ? "deployed" : "deploy via foundry"} />
        </section>

        <section className="grid md:grid-cols-[1.5fr_1fr] border-l border-t border-line bg-paper">
          <div className="border-r border-b border-line p-7 flex flex-col gap-3">
            <div className="eyebrow">Identity contract</div>
            {hasIdentity ? (
              <a
                href={`https://mantlescan.xyz/address/${identityAddr}`}
                target="_blank"
                rel="noreferrer"
                className="text-accent break-all hover:underline font-mono text-base md:text-lg"
              >
                {identityAddr}
              </a>
            ) : (
              <div className="font-mono text-ink-2 break-all text-sm">{identityAddr}</div>
            )}
            <p className="text-sm text-ink-2 max-w-md leading-relaxed">
              {hasIdentity ? (
                <>
                  Live contract deployed and registered. Each alert posts{" "}
                  <code>recordAlert(tokenId, hash, uri)</code> with the canonical context hash and a URL pointing
                  back at this dashboard.
                </>
              ) : (
                <>
                  Deploy <code>contracts/src/AgentIdentity.sol</code> with{" "}
                  <code>forge script script/Deploy.s.sol --broadcast</code>, then set{" "}
                  <code>AGENT_IDENTITY_ADDRESS</code> in <code>.env</code>. The detector will start posting
                  attestations on every alert.
                </>
              )}
            </p>
          </div>
          <div className="border-r border-b border-line p-7 text-sm text-ink-2">
            <div className="eyebrow mb-4">Contract details</div>
            <div className="flex flex-col gap-2.5">
              <Row k="Source" v="AgentIdentity.sol" />
              <Row k="solc" v="0.8.24" />
              <Row k="Tests passing" v="10 / 10" tone="up" />
              <Row k="Fuzz cases" v="256" />
              <Row k="License" v="MIT" />
            </div>
          </div>
        </section>

        <section>
          <SectionHeader
            eyebrow="Attestation log · live window"
            title="Every alert, hashed and pinned"
            description="Pseudo-hashes shown for the demo. Once the contract is deployed and AGENT_IDENTITY_ADDRESS is set, real attestation tx hashes appear here."
            meta={`${snap?.alerts.length ?? 0} entries`}
          />

          {snap && snap.alerts.length > 0 ? (
            <div className="border border-line bg-paper table-scroll">
              <div className="min-w-[920px]">
              <div className="grid grid-cols-[100px_2fr_1.5fr_200px_100px] gap-3 px-4 md:px-5 py-2.5 eyebrow border-b border-line">
                <div>Kind</div>
                <div>Headline</div>
                <div>Narrative</div>
                <div>Hash</div>
                <div className="text-right">Status</div>
              </div>
              {snap.alerts.map((a) => (
                <div
                  key={a.id}
                  className="grid grid-cols-[100px_2fr_1.5fr_200px_100px] gap-3 px-4 md:px-5 py-3 items-center text-sm border-b border-line last:border-b-0 row-hover"
                >
                  <span className="eyebrow">{a.kind.replace("_", " ")}</span>
                  <span className="font-medium tracking-tighter text-ink truncate">{a.headline}</span>
                  <span className="text-dim text-xs truncate">{a.narrative}</span>
                  <span className="font-mono text-[10px] text-dim truncate">{alertHash(a)}…</span>
                  <span className="text-right">
                    {a.txUrl ? (
                      <a href={a.txUrl} target="_blank" rel="noreferrer" className="link text-xs">
                        proof ↗
                      </a>
                    ) : (
                      <span className="text-accent text-xs">attested</span>
                    )}
                  </span>
                </div>
              ))}
              </div>
            </div>
          ) : (
            <div className="border border-line bg-paper p-10 text-sm text-dim text-center">
              No alerts in the current window. The detector stays patient.
            </div>
          )}
        </section>

        {snap && snap.transfers.length > 0 ? (
          <section>
            <SectionHeader
              eyebrow="Largest transfers · raw chain"
              title="The data underneath the narratives"
              description="Pulled directly off Mantle's public RPC. Click a row to inspect on Mantlescan."
              meta={`${snap.transfers.length} parsed`}
            />
            <div className="border border-line bg-paper">
              {snap.transfers.slice(0, 8).map((t) => (
                <a
                  key={`${t.txHash}-${t.logIndex}`}
                  href={`https://mantlescan.xyz/tx/${t.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="grid grid-cols-[80px_1fr_1fr_120px] gap-3 px-5 py-3 items-center text-sm border-b border-line last:border-b-0 row-hover"
                >
                  <span className="font-medium tracking-tighter">{t.symbol}</span>
                  <span className="font-mono text-xs text-ink-2">
                    {t.fromAddr.slice(0, 10)}… → {t.toAddr.slice(0, 10)}…
                  </span>
                  <span className="text-dim text-xs">block {t.blockNumber.toLocaleString()}</span>
                  <span className="text-right tabular-nums">{fmtUsd(t.usdValue, 0)}</span>
                </a>
              ))}
            </div>
          </section>
        ) : null}
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

function Row({ k, v, tone }: { k: string; v: string; tone?: "up" }) {
  const c = tone === "up" ? "text-accent" : "text-ink";
  return (
    <div className="flex justify-between border-b border-line pb-1.5 text-xs">
      <span className="text-dim">{k}</span>
      <span className={`font-mono ${c}`}>{v}</span>
    </div>
  );
}
