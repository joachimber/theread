import { TelegramButton } from "./TelegramButton";

export function CTABanner() {
  return (
    <section className="border border-ink bg-ink text-bg p-7 md:p-14 grid md:grid-cols-[1.4fr_1fr] gap-8 md:gap-10 items-center relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, #f7f4ea 1px, transparent 1px), linear-gradient(to bottom, #f7f4ea 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="relative">
        <div className="eyebrow text-bg/60 mb-3">Plug it in</div>
        <h2 className="text-[clamp(28px,3.5vw,44px)] tracking-tighter font-semibold leading-[1.05]">
          Mantle in your pocket,
          <span className="text-accent"> on the hour.</span>
        </h2>
        <p className="text-[15px] text-bg/75 mt-4 max-w-lg leading-relaxed">
          The channel posts an hourly market wrap on every UTC hour — past 60
          minutes of flow, top token, biggest single transfer. Plus a curated
          editor&apos;s pick once a day at 00:00 UTC, pinned on Mantle via ERC-8004.
          Real-time push for genuinely novel events on top.
        </p>
      </div>
      <div className="relative flex flex-col items-start md:items-end gap-3">
        <TelegramButton
          size="lg"
          variant="ghost"
          className="!bg-bg !text-ink !border-bg hover:!bg-accent hover:!text-bg hover:!border-accent"
        />
        <ul className="text-xs text-bg/60 max-w-xs md:text-right space-y-1">
          <li>📊 hourly market wrap (UTC)</li>
          <li>📖 daily editor&apos;s pick · attested on-chain</li>
          <li>🔴 real-time push for sev-5 events</li>
        </ul>
      </div>
    </section>
  );
}
