const links = [
  { name: "Mantle Network", url: "https://mantle.xyz", caption: "L2 distribution layer · $4B+ TVL" },
  { name: "Anthropic Claude", url: "https://anthropic.com", caption: "narrator · Sonnet 4.6 with prompt caching" },
  { name: "ERC-8004", url: "https://eips.ethereum.org/EIPS/eip-8004", caption: "agent identity · attestation log" },
  { name: "Coingecko", url: "https://coingecko.com", caption: "price oracle for USD denomination" },
];

export function BuiltOn() {
  return (
    <section>
      <div className="eyebrow mb-3">Built on</div>
      <div className="grid grid-cols-2 md:grid-cols-4 border-l border-t border-line bg-paper">
        {links.map((l) => (
          <a
            key={l.name}
            href={l.url}
            target="_blank"
            rel="noreferrer"
            className="border-r border-b border-line p-5 row-hover flex flex-col gap-1.5"
          >
            <div className="text-[15px] font-semibold tracking-tighter text-ink">{l.name}</div>
            <div className="text-xs text-dim leading-[1.5]">{l.caption}</div>
            <div className="text-xs text-accent mt-auto pt-2 inline-flex items-center gap-1">visit ↗</div>
          </a>
        ))}
      </div>
    </section>
  );
}
