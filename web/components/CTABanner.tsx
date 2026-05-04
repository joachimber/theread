import { TelegramButton } from "./TelegramButton";

export function CTABanner() {
  return (
    <section className="border border-ink bg-ink text-bg p-10 md:p-14 grid md:grid-cols-[1.4fr_1fr] gap-10 items-center relative overflow-hidden">
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
          Get every Mantle move in your Telegram
          <span className="text-accent"> in one tap.</span>
        </h2>
        <p className="text-[15px] text-bg/75 mt-4 max-w-lg leading-relaxed">
          The Read posts a one-sentence narrative the moment something moves — price spikes, whale flows, volume
          anomalies. Each alert carries an on-chain proof you can audit later.
        </p>
      </div>
      <div className="relative flex flex-col items-start md:items-end gap-3">
        <TelegramButton size="lg" variant="ghost" className="!bg-bg !text-ink !border-bg hover:!bg-accent hover:!text-bg hover:!border-accent" />
        <div className="text-xs text-bg/55 max-w-xs md:text-right">
          Bot is read-only. Set <code className="bg-bg/10 text-bg px-1.5 py-0.5">NEXT_PUBLIC_TELEGRAM_URL</code> to point
          at your own channel before deploying.
        </div>
      </div>
    </section>
  );
}
