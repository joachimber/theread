const steps = [
  {
    n: "01",
    title: "Index every Mantle block",
    body:
      "An always-on indexer streams Transfer + Swap events on the tokens that move flow on Mantle (mETH, USDe, USDY, fBTC, MNT, USDC) and prices them through Coingecko.",
  },
  {
    n: "02",
    title: "Detect what's worth saying",
    body:
      "Three detectors run continuously: price-spikes against rolling baselines, volume anomalies as σ above 24h averages, and whale moves above a USD floor. Cooldowns prevent dupes.",
  },
  {
    n: "03",
    title: "Narrate, attest, deliver",
    body:
      "Each detection is rewritten in plain English by Z.ai's GLM-5.1 (served via Venice for private inference), hashed, pinned on Mantle via ERC-8004 recordAlert(), and pushed to Telegram + Discord with the on-chain proof inline.",
  },
];

export function HowItWorks() {
  return (
    <section>
      <div className="border-b border-line pb-3 mb-5">
        <div className="eyebrow mb-2">How it works</div>
        <h2 className="text-[26px] tracking-tighter font-semibold text-ink">From block to one sentence in under a minute.</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 border-l border-t border-line bg-paper">
        {steps.map((s) => (
          <div key={s.n} className="border-r border-b border-line p-7 min-h-[200px] flex flex-col">
            <div className="font-mono text-xs text-accent mb-3">{s.n}</div>
            <div className="text-[18px] tracking-tighter font-semibold text-ink leading-snug">{s.title}</div>
            <p className="text-sm text-ink-2 mt-3 leading-[1.6]">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
