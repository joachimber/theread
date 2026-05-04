export function AvailableOnVirtuals() {
  return (
    <section className="border border-line bg-paper grid md:grid-cols-[1.4fr_1fr] gap-0 overflow-hidden">
      <div className="p-8 md:p-10 border-b md:border-b-0 md:border-r border-line">
        <div className="eyebrow mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 inline-block bg-accent" />
          Agent Commerce Protocol
        </div>
        <h2 className="text-[clamp(24px,3vw,38px)] tracking-tighter font-semibold text-ink leading-[1.1] mb-3">
          Available as an agent on{" "}
          <a
            href="https://app.virtuals.io/acp"
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:underline"
          >
            Virtuals Protocol
          </a>
          .
        </h2>
        <p className="text-[15px] text-ink-2 leading-[1.55] max-w-prose">
          Buyer agents call <code>narrate_event</code> for one-sentence Mantle reads, or
          <code> mantle_smart_money</code> for top movers in the live window. Pricing is per-call
          (USDC on Base) plus optional subscription tiers. The seller runtime proxies to The Read&apos;s
          narrator and indexer.
        </p>
        <a
          href="https://app.virtuals.io/acp"
          target="_blank"
          rel="noreferrer"
          className="btn-ghost mt-6 text-sm"
        >
          Browse on Virtuals ↗
        </a>
      </div>
      <div className="p-8 md:p-10 bg-line-2/40 flex flex-col gap-3 text-sm">
        <div className="eyebrow text-[10px]">Service offerings</div>
        <Offering name="narrate_event" desc="Structured anomaly → 1-sentence read" price="$0.10" />
        <Offering name="mantle_smart_money" desc="Top wallet movers · 8-min window" price="$0.25" />
        <div className="text-[11px] text-dim mt-3 leading-relaxed">
          Subscription tiers from $5/mo. Definitions live in{" "}
          <code>virtuals/*/offering.json</code> in the repo.
        </div>
      </div>
    </section>
  );
}

function Offering({ name, desc, price }: { name: string; desc: string; price: string }) {
  return (
    <div className="border border-line bg-paper p-4 flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[13px] text-ink">{name}</span>
        <span className="font-mono text-xs text-accent tabular-nums">{price}</span>
      </div>
      <span className="text-xs text-dim leading-[1.5]">{desc}</span>
    </div>
  );
}
