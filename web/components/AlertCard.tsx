import { Sparkline } from "./Sparkline";

export interface AlertCardData {
  id: string | number;
  kind: string;
  severity: number;
  token: string | null;
  headline: string;
  narrative: string;
  txUrl: string | null;
  attestationTx?: string | null;
  ago: string;
  spark?: number[];
  pct?: number;
  usd?: number;
}

const KIND_COLOR: Record<string, string> = {
  price_spike: "text-accent",
  volume_spike: "text-warn",
  whale_move: "text-ink",
  flow_shift: "text-warn",
};

export function AlertCard({ a }: { a: AlertCardData }) {
  const tone = KIND_COLOR[a.kind] ?? "text-ink";
  const sigPip = "■".repeat(Math.max(1, Math.min(5, a.severity)));
  return (
    <article className="border-r border-b border-line bg-paper p-4 md:p-5 flex flex-col gap-2.5 md:gap-3 min-h-[180px] md:min-h-[200px] row-hover">
      <div className="flex items-center justify-between eyebrow">
        <div className="flex items-center gap-2">
          <span className={`${tone}`}>{a.kind.replace("_", " ")}</span>
          {a.token ? (
            <>
              <span className="text-line">/</span>
              <span className="text-dim">{a.token}</span>
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-2 text-dim">
          <span className={`tabular-nums ${tone}`}>{sigPip}</span>
          <span>{a.ago}</span>
        </div>
      </div>

      <h3 className={`text-[20px] tracking-tighter font-semibold leading-[1.15] ${tone}`}>{a.headline}</h3>
      <p className="text-[14px] text-ink-2 leading-[1.55]">{a.narrative}</p>

      <div className="mt-auto flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5 text-dim flex-wrap">
          {a.txUrl ? (
            <a href={a.txUrl} target="_blank" rel="noreferrer" className="link">
              tx ↗
            </a>
          ) : null}
          {a.txUrl ? <span>·</span> : null}
          <span>
            {a.attestationTx ? (
              <a
                href={`https://mantlescan.xyz/tx/${a.attestationTx}`}
                target="_blank"
                rel="noreferrer"
                className="link"
              >
                attested ↗
              </a>
            ) : (
              <span className="text-dim">unattested</span>
            )}
          </span>
          <span className="text-dim/70">·</span>
          <span className="text-dim/70 text-[10px] uppercase tracking-widest">via GLM-4.7</span>
        </div>
        {a.spark?.length ? (
          <div className={tone}>
            <Sparkline values={a.spark} width={68} height={20} fill="currentColor" />
          </div>
        ) : null}
      </div>
    </article>
  );
}
