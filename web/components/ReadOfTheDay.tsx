import type { AlertRow } from "../lib/queries";
import { fmtRel } from "../lib/format";

interface ReadOfTheDayProps {
  alert: AlertRow;
}

export function ReadOfTheDay({ alert }: ReadOfTheDayProps) {
  const date = new Date().toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const created = typeof alert.createdAt === "string" ? new Date(alert.createdAt) : alert.createdAt;

  return (
    <article className="border border-ink bg-ink text-bg relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, #f7f4ea 1px, transparent 1px), linear-gradient(to bottom, #f7f4ea 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="relative grid lg:grid-cols-[200px_1fr_240px] gap-0">
        <div className="p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-bg/15">
          <div className="eyebrow text-bg/60 mb-3">The Read</div>
          <div className="text-[20px] tracking-tighter font-semibold leading-tight">{date}</div>
          <div className="text-xs text-bg/55 mt-2 leading-relaxed">
            One curated read — the day&apos;s most significant move on Mantle. Pinned on-chain via
            ERC-8004.
          </div>
        </div>
        <div className="p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-bg/15">
          <div className="flex items-center gap-3 eyebrow text-bg/60 mb-4">
            <span className="text-accent">{alert.kind.replace("_", " ")}</span>
            {alert.token ? (
              <>
                <span className="text-bg/30">/</span>
                <span>{alert.token}</span>
              </>
            ) : null}
            <span className="text-bg/30">/</span>
            <span>{fmtRel(created)}</span>
          </div>
          <h2 className="text-[clamp(22px,2.5vw,32px)] leading-[1.15] tracking-tighter font-semibold mb-3">
            {alert.headline}
          </h2>
          <p className="text-[15px] md:text-[17px] text-bg/85 leading-[1.6]">{alert.narrative}</p>
        </div>
        <div className="p-6 md:p-8 flex flex-col justify-between bg-bg/[0.03]">
          <div>
            <div className="eyebrow text-bg/60 mb-2">Status</div>
            <div className="text-[15px] font-semibold text-accent">
              {alert.attestationTx ? "Attested on Mantle" : "Pending attestation"}
            </div>
            <div className="text-xs text-bg/55 mt-2">
              Severity {alert.severity}/5 · selected by composite score
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-2 text-xs">
            {alert.txUrl ? (
              <a
                href={alert.txUrl}
                target="_blank"
                rel="noreferrer"
                className="text-bg/70 hover:text-accent inline-flex items-center gap-1"
              >
                view tx ↗
              </a>
            ) : null}
            {alert.attestationTx ? (
              <a
                href={`https://mantlescan.xyz/tx/${alert.attestationTx}`}
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:underline inline-flex items-center gap-1"
              >
                attestation ↗
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
