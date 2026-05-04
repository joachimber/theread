const links = [
  {
    name: "Mantle Network",
    url: "https://mantle.xyz",
    caption: "L2 distribution layer · $4B+ TVL · primary chain",
    role: "Chain",
  },
  {
    name: "Z.ai · GLM-5.1",
    url: "https://z.ai",
    caption: "open-weights model from Zhiyuan AI · narrator",
    role: "Inference",
  },
  {
    name: "Venice.ai",
    url: "https://venice.ai/chat?model=zai-org-glm-5-1",
    caption: "private inference for GLM-5.1 (E2EE)",
    role: "Inference path",
  },
  {
    name: "Nansen",
    url: "https://app.nansen.ai/smart-money",
    caption: "wallet labels + smart-money copy-trade",
    role: "Wallet intel",
  },
  {
    name: "Elfa AI",
    url: "https://www.elfa.ai/api",
    caption: "social mindshare · trending tokens",
    role: "Social signal",
  },
  {
    name: "ERC-8004",
    url: "https://eips.ethereum.org/EIPS/eip-8004",
    caption: "agent identity standard · attestation log",
    role: "Identity",
  },
  {
    name: "Anthropic Claude",
    url: "https://anthropic.com",
    caption: "Sonnet 4.6 narrator fallback path",
    role: "Inference fallback",
  },
  {
    name: "Virtuals Protocol",
    url: "https://app.virtuals.io/acp",
    caption: "ACP marketplace listing · narrate_event + mantle_smart_money",
    role: "Distribution",
  },
  {
    name: "Coingecko",
    url: "https://coingecko.com",
    caption: "USD price oracle for the indexer",
    role: "Prices",
  },
];

export function BuiltOn() {
  return (
    <section>
      <div className="border-b border-line pb-3 mb-5">
        <div className="eyebrow mb-2">Built on</div>
        <h2 className="text-[26px] tracking-tighter font-semibold text-ink">
          A stack picked piece by piece — every partner is doing what they&apos;re best at.
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 border-l border-t border-line bg-paper">
        {links.map((l) => (
          <a
            key={l.name}
            href={l.url}
            target="_blank"
            rel="noreferrer"
            className="border-r border-b border-line p-5 row-hover flex flex-col gap-1.5 min-h-[140px]"
          >
            <div className="eyebrow text-[10px]">{l.role}</div>
            <div className="text-[15px] font-semibold tracking-tighter text-ink">{l.name}</div>
            <div className="text-xs text-dim leading-[1.5]">{l.caption}</div>
            <div className="text-xs text-accent mt-auto pt-2 inline-flex items-center gap-1">visit ↗</div>
          </a>
        ))}
      </div>
    </section>
  );
}
