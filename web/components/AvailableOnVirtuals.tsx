export function AvailableOnVirtuals() {
  return (
    <section className="border border-line bg-paper grid lg:grid-cols-[1.4fr_1fr] gap-0 overflow-hidden">
      <div className="p-6 md:p-10 border-b lg:border-b-0 lg:border-r border-line">
        <div className="eyebrow mb-3 flex items-center gap-2 flex-wrap">
          <span className="w-1.5 h-1.5 inline-block bg-accent" />
          Agent Commerce Protocol
          <span className="text-line">/</span>
          <span className="text-dim">Virtuals on Base</span>
        </div>
        <h2 className="text-[clamp(22px,3vw,38px)] tracking-tighter font-semibold text-ink leading-[1.1] mb-4">
          Free for humans.
          <br />
          <span className="text-accent">Paid for agents.</span>
        </h2>
        <p className="text-[14px] md:text-[15px] text-ink-2 leading-[1.6] max-w-prose">
          Humans get The Read for free on Telegram (hourly market wraps, daily editor&apos;s
          pick, real-time sev-5 alerts). Other AI agents pay per-call to use the same
          narrator and smart-money endpoint inside their own decision loops. Trading bots,
          research assistants, and on-chain analyzers settle in USDC on Base.
        </p>
        <p className="text-[12px] md:text-[13px] text-dim mt-3 leading-[1.6] max-w-prose">
          Same engine, two pricing models. The Telegram bot is the consumer surface;
          Virtuals ACP is the wholesale API.
        </p>
        <a
          href="https://app.virtuals.io/acp"
          target="_blank"
          rel="noreferrer"
          className="btn-ghost mt-6 text-sm inline-flex"
        >
          Browse on Virtuals ↗
        </a>
      </div>
      <div className="p-6 md:p-10 bg-line-2/40 flex flex-col gap-3 text-sm">
        <div className="eyebrow text-[10px]">B2A endpoints</div>
        <Offering
          name="narrate_event"
          desc="POST a structured anomaly, get a one-sentence read back. For agents that already detect — they outsource the writing."
          price="$0.10"
          unit="per call"
        />
        <Offering
          name="mantle_smart_money"
          desc="Top wallet movers in the live 8-min window with flow direction. For trading agents copy-trading or building risk filters."
          price="$0.25"
          unit="per call"
        />
        <div className="text-[11px] text-dim mt-3 leading-relaxed">
          Subscription tiers from <span className="text-ink">$1/mo</span>. Definitions live in{" "}
          <code className="break-all">virtuals/*/offering.json</code>.
        </div>
      </div>
    </section>
  );
}

function Offering({
  name,
  desc,
  price,
  unit,
}: {
  name: string;
  desc: string;
  price: string;
  unit: string;
}) {
  return (
    <div className="border border-line bg-paper p-4 flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[13px] text-ink">{name}</span>
        <span className="flex items-baseline gap-1.5">
          <span className="font-mono text-sm text-accent tabular-nums">{price}</span>
          <span className="text-[10px] text-dim uppercase tracking-widest">{unit}</span>
        </span>
      </div>
      <span className="text-xs text-dim leading-[1.55]">{desc}</span>
    </div>
  );
}
