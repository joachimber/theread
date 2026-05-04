import { fmtRel } from "../lib/format";

export interface AlertRowData {
  id: number;
  kind: string;
  severity: number;
  token: string | null;
  headline: string;
  narrative: string;
  txUrl: string | null;
  attestationTx: string | null;
  createdAt: Date | string;
}

const SEVERITY_LABEL = ["·", "·", "·", "‼", "‼", "●"];

const KIND_COLORS: Record<string, string> = {
  price_spike: "text-accent",
  volume_spike: "text-warn",
  whale_move: "text-ink",
  flow_shift: "text-warn",
};

export function AlertRow({ a }: { a: AlertRowData }) {
  const created = typeof a.createdAt === "string" ? new Date(a.createdAt) : a.createdAt;
  const cls = KIND_COLORS[a.kind] ?? "text-ink";
  return (
    <article className="border-t border-line py-3 grid grid-cols-[60px_120px_1fr_120px] gap-4 items-start">
      <div className="text-xs text-dim">{fmtRel(created)}</div>
      <div className="flex flex-col gap-0.5">
        <span className={`text-xs uppercase tracking-wider ${cls}`}>{a.kind.replace("_", " ")}</span>
        {a.token ? <span className="text-xs text-dim">{a.token}</span> : null}
        <span className="text-xs text-dim">sev {SEVERITY_LABEL[a.severity] ?? "·"} {a.severity}</span>
      </div>
      <div>
        <div className="text-sm font-semibold">{a.headline}</div>
        <div className="text-sm text-dim mt-1 leading-relaxed">{a.narrative}</div>
      </div>
      <div className="flex flex-col gap-1 text-xs text-dim items-end">
        {a.txUrl ? (
          <a href={a.txUrl} target="_blank" rel="noreferrer" className="hover:text-accent">tx ↗</a>
        ) : null}
        {a.attestationTx ? (
          <a
            href={`https://mantlescan.xyz/tx/${a.attestationTx}`}
            target="_blank"
            rel="noreferrer"
            className="hover:text-accent"
          >
            attested ↗
          </a>
        ) : (
          <span className="text-dim/60">unattested</span>
        )}
      </div>
    </article>
  );
}
