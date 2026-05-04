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

const KIND_TONE: Record<string, string> = {
  price_spike: "text-accent",
  volume_spike: "text-warn",
  whale_move: "text-ink",
  flow_shift: "text-warn",
};

export function AlertCard({ a }: { a: AlertCardData }) {
  const tone = KIND_TONE[a.kind] ?? "text-ink";
  const sigPip = "■".repeat(Math.max(1, Math.min(5, a.severity)));
  return (
    <article className="border border-line bg-panel hover:border-line/0 hover:outline hover:outline-1 hover:outline-accent/30 transition-colors row-hover p-5 flex flex-col gap-3 min-h-[180px]">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-dim">
        <div className="flex items-center gap-2">
          <span className={tone}>{a.kind.replace("_", " ")}</span>
          {a.token ? (
            <>
              <span className="text-line">/</span>
              <span>{a.token}</span>
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <span className={`tabular-nums ${tone}`}>{sigPip}</span>
          <span>{a.ago}</span>
        </div>
      </div>

      <h3 className={`text-xl tracking-tight font-semibold leading-tight ${tone}`}>{a.headline}</h3>
      <p className="text-sm text-ink/80 leading-relaxed">{a.narrative}</p>

      <div className="mt-auto flex items-center justify-between text-xs">
        <div className="flex items-center gap-3 text-dim">
          {a.txUrl ? (
            <a href={a.txUrl} target="_blank" rel="noreferrer" className="hover:text-accent">
              tx ↗
            </a>
          ) : null}
          <span>·</span>
          <span>
            {a.attestationTx ? (
              <a
                href={`https://mantlescan.xyz/tx/${a.attestationTx}`}
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:underline"
              >
                attested ↗
              </a>
            ) : (
              <span className="text-dim">unattested</span>
            )}
          </span>
        </div>
        {a.spark?.length ? (
          <div className={tone}>
            <Sparkline values={a.spark} width={60} height={18} />
          </div>
        ) : null}
      </div>
    </article>
  );
}
