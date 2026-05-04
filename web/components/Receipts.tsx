import { getOnchainStats } from "../lib/onchain-stats";

export async function Receipts() {
  const stats = await getOnchainStats();
  const addr = stats.contractAddress ?? "";
  const tokenId = stats.tokenId ?? "1";

  return (
    <section>
      <div className="border-b border-line pb-3 mb-5">
        <div className="eyebrow mb-2">Open record</div>
        <h2 className="text-[22px] md:text-[26px] tracking-tighter font-semibold text-ink leading-[1.15]">
          Everything this agent says is publicly auditable.
        </h2>
        <p className="text-[13px] md:text-sm text-dim mt-1.5 max-w-2xl leading-relaxed">
          The contract, source code, on-chain function, and rolling attestation log — every artifact
          a judge or buyer would want to verify, in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-t border-line bg-paper">
        <Cell
          eyebrow="Contract"
          title="AgentIdentity.sol"
          subtitle={addr ? `${addr.slice(0, 10)}…${addr.slice(-8)}` : "deploy first"}
          href={addr ? `https://mantlescan.xyz/address/${addr}#code` : null}
          cta="View source on Mantlescan"
          mono
        />
        <Cell
          eyebrow="Token ID"
          title={`#${tokenId}`}
          subtitle="ERC-8004 agent identity NFT"
          href={addr ? `https://mantlescan.xyz/token/${addr}?a=${tokenId}` : null}
          cta="View NFT page"
        />
        <Cell
          eyebrow="On-chain function"
          title="recordAlert(tokenId, hash, uri)"
          subtitle="Called by the worker on every severity-5 alert + daily digest"
          href={
            addr
              ? `https://mantlescan.xyz/address/${addr}#writeContract`
              : null
          }
          cta="Read & write contract"
          mono
        />
        <Cell
          eyebrow="Source code"
          title="github.com/joachimber/theread"
          subtitle="MIT · Solidity 0.8.24 · 10 Foundry tests passing"
          href="https://github.com/joachimber/theread"
          cta="Open repo"
        />
        <Cell
          eyebrow="Attestation log"
          title={stats.attestedCount.toString()}
          subtitle={`${stats.totalAlerts} total alerts · ${stats.ratio}% pinned on-chain`}
          href="/agent"
          cta="View log"
          internal
        />
        <Cell
          eyebrow="Inference path"
          title="GLM-4.7 Flash via Venice"
          subtitle="Open-weights model from Z.ai · E2EE inference"
          href="https://venice.ai/chat?model=zai-org-glm-4.7-flash"
          cta="Try the model"
        />
      </div>

      <div className="mt-4 text-[11px] text-dim leading-relaxed">
        Standard followed: <a href="https://eips.ethereum.org/EIPS/eip-8004" target="_blank" rel="noreferrer" className="link">ERC-8004 (agent identity)</a>{" "}
        · Chain: <a href="https://mantlescan.xyz/" target="_blank" rel="noreferrer" className="link">Mantle (5000)</a>{" "}
        · Verifier: <a href="https://etherscan.io/apis" target="_blank" rel="noreferrer" className="link">Etherscan v2 unified API</a>
      </div>
    </section>
  );
}

interface CellProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  href: string | null;
  cta: string;
  mono?: boolean;
  internal?: boolean;
}

function Cell({ eyebrow, title, subtitle, href, cta, mono = false, internal = false }: CellProps) {
  const titleClass = mono ? "font-mono text-[13px] md:text-[14px] break-all" : "text-[15px] tracking-tighter font-semibold";
  const inner = (
    <div className="border-r border-b border-line p-5 row-hover flex flex-col gap-2 min-h-[140px]">
      <div className="eyebrow text-[10px]">{eyebrow}</div>
      <div className={`${titleClass} text-ink leading-snug`}>{title}</div>
      <div className="text-xs text-dim leading-[1.55]">{subtitle}</div>
      <div className="text-xs text-accent mt-auto pt-2 inline-flex items-center gap-1">
        {cta} {href ? "↗" : ""}
      </div>
    </div>
  );
  if (!href) return inner;
  if (internal) return <a href={href}>{inner}</a>;
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {inner}
    </a>
  );
}
