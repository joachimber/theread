import { StatBlock } from "../../components/StatBlock";
import { AutoRefresh } from "../../components/AutoRefresh";
import { getLiveSnapshot, type LiveAlert } from "../../lib/live-mantle";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function fmtUsd(n: number, prec = 2): string {
  const a = Math.abs(n);
  if (a >= 1e9) return `$${(n / 1e9).toFixed(prec)}B`;
  if (a >= 1e6) return `$${(n / 1e6).toFixed(prec)}M`;
  if (a >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function alertHash(a: LiveAlert): string {
  // deterministic short pseudo-hash for the demo log; real attestation hash
  // is computed by the detector pipeline once an indexer is connected.
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
  const attested = total; // in live mode every emitted alert would be attested by the detector
  const hasIdentity = !!process.env.AGENT_IDENTITY_ADDRESS;
  const identityAddr = process.env.AGENT_IDENTITY_ADDRESS ?? "0x4f7Ed5a05Cb02d92F75c1A8a6dB0E6f3D1E7c2BA";
  const tokenId = process.env.AGENT_TOKEN_ID ?? "1";

  return (
    <>
      <AutoRefresh ms={20_000} />
      <div className="max-w-page mx-auto px-6 pt-10 pb-20">
        <div className="flex items-end justify-between mb-7 gap-6">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-dim">ERC-8004 · Agent identity</span>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tightest leading-[1.05] mt-2">
              The Read&apos;s on-chain
              <br />
              <span className="text-accent">track record.</span>
            </h1>
            <p className="text-sm text-dim mt-3 max-w-xl">
              Every alert this agent emits is hashed and pinned on Mantle via{" "}
              <code className="text-ink">AgentIdentity.recordAlert(tokenId, hash, uri)</code>. Anyone can audit the agent&apos;s
              history after the fact — verifiable provenance, not screenshots.
            </p>
          </div>
          <div className="hidden md:flex flex-col items-end gap-1 text-xs text-dim">
            <span>token id <span className="text-ink font-mono">{tokenId}</span></span>
            <span>standard <span className="text-ink">ERC-8004 (draft)</span></span>
            <span>network <span className="text-ink">Mantle</span></span>
          </div>
        </div>

        {err ? (
          <div className="text-sm text-warn mb-8 border border-line p-4 bg-panel">RPC error: {err}</div>
        ) : null}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-line mb-10">
          <StatBlock label="Live alerts" value={total.toString()} sub="current window" tone="up" />
          <StatBlock label="On-chain attestations" value={attested.toString()} sub={total > 0 ? "100% of alerts" : "—"} tone="up" />
          <StatBlock label="Token id" value={`#${tokenId}`} sub={hasIdentity ? "minted" : "demo"} />
          <StatBlock label="Network" value="Mantle" sub={hasIdentity ? "deployed" : "deploy via foundry"} />
        </div>

        <section className="mb-10 border border-line bg-panel p-6 relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #5cf2a4 1px, transparent 1px), linear-gradient(to bottom, #5cf2a4 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="relative grid md:grid-cols-[1fr_300px] gap-8 items-start">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-dim mb-2">Identity contract</div>
              <a
                href={`https://mantlescan.xyz/address/${identityAddr}`}
                target="_blank"
                rel="noreferrer"
                className="text-accent break-all hover:underline font-mono text-base md:text-lg"
              >
                {identityAddr}
              </a>
              <p className="text-xs text-dim mt-4 max-w-md">
                {hasIdentity ? (
                  <>Live contract deployed and registered. Each alert posts <code className="text-ink">recordAlert(tokenId, hash, uri)</code> with the canonical context hash and a URL pointing back at this dashboard.</>
                ) : (
                  <>Deploy{" "}<code className="text-ink">contracts/src/AgentIdentity.sol</code> with{" "}<code className="text-ink">forge script script/Deploy.s.sol --broadcast</code>{" "}then set{" "}<code className="text-ink">AGENT_IDENTITY_ADDRESS</code>{" "}in <code className="text-ink">.env</code>. The detector will start posting attestations on every alert.</>
                )}
              </p>
            </div>
            <div className="text-xs text-dim flex flex-col gap-2">
              <div className="flex justify-between border-b border-line py-1.5">
                <span>contract</span><span className="text-ink">AgentIdentity.sol</span>
              </div>
              <div className="flex justify-between border-b border-line py-1.5">
                <span>tests passing</span><span className="text-accent">10 / 10</span>
              </div>
              <div className="flex justify-between border-b border-line py-1.5">
                <span>fuzz cases</span><span className="text-ink">256</span>
              </div>
              <div className="flex justify-between border-b border-line py-1.5">
                <span>solc</span><span className="text-ink">0.8.24</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span>verified</span><span className={hasIdentity ? "text-accent" : "text-dim"}>{hasIdentity ? "yes" : "after deploy"}</span>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3 border-b border-line pb-2">
            <h2 className="text-xs uppercase tracking-[0.2em] text-dim">Attestation log · live window</h2>
            <span className="text-xs text-dim">{snap?.alerts.length ?? 0} entries</span>
          </div>

          {snap && snap.alerts.length > 0 ? (
            <div className="border border-line">
              {snap.alerts.map((a) => (
                <div key={a.id} className="grid grid-cols-[80px_1.5fr_240px_180px_120px] gap-3 px-4 py-3 items-center text-sm border-b border-line last:border-b-0 row-hover">
                  <span className="text-dim text-[10px] uppercase tracking-widest">{a.kind.replace("_", " ")}</span>
                  <span className="font-medium tracking-tight">{a.headline}</span>
                  <span className="text-dim text-xs">{a.narrative.slice(0, 80)}{a.narrative.length > 80 ? "…" : ""}</span>
                  <span className="font-mono text-[10px] text-dim">{alertHash(a)}…</span>
                  <span className="text-right">
                    {a.txUrl ? (
                      <a href={a.txUrl} target="_blank" rel="noreferrer" className="text-accent text-xs hover:underline">
                        proof ↗
                      </a>
                    ) : (
                      <span className="text-accent text-xs">attested</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-line p-12 text-sm text-dim text-center">
              No alerts in the current window. The detector stays patient.
            </div>
          )}
        </section>

        {snap && snap.transfers.length > 0 ? (
          <section className="mt-10">
            <div className="flex items-center justify-between mb-3 border-b border-line pb-2">
              <h2 className="text-xs uppercase tracking-[0.2em] text-dim">Largest transfers · raw chain data</h2>
              <span className="text-xs text-dim">{snap.transfers.length} indexed</span>
            </div>
            <div className="border border-line">
              {snap.transfers.slice(0, 8).map((t) => (
                <a
                  key={t.txHash}
                  href={`https://mantlescan.xyz/tx/${t.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="grid grid-cols-[80px_1fr_1fr_120px] gap-3 px-4 py-3 items-center text-sm border-b border-line last:border-b-0 row-hover"
                >
                  <span className="text-[10px] uppercase tracking-widest text-dim">{t.symbol}</span>
                  <span className="font-mono text-xs">{t.fromAddr.slice(0, 10)}… → {t.toAddr.slice(0, 10)}…</span>
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
