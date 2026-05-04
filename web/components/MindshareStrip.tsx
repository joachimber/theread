import { getElfaMindshare, type ElfaToken } from "../lib/elfa";

function fmtChange(pct: number): { text: string; tone: string } {
  if (pct > 0) return { text: `+${pct.toFixed(0)}%`, tone: "text-accent" };
  if (pct < 0) return { text: `${pct.toFixed(0)}%`, tone: "text-red" };
  return { text: "0%", tone: "text-dim" };
}

export async function MindshareStrip() {
  const snap = await getElfaMindshare();
  const isPlaceholder = snap.source === "placeholder";

  return (
    <section className="border border-line bg-paper">
      <div className="grid lg:grid-cols-[280px_1.2fr_1fr] gap-0">
        <div className="border-b lg:border-b-0 lg:border-r border-line p-6">
          <div className="eyebrow mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 inline-block bg-accent" />
            Social vs on-chain
          </div>
          <h3 className="text-[20px] tracking-tighter font-semibold text-ink mb-3 leading-snug">
            Mindshare layer
          </h3>
          <p className="text-xs text-dim leading-relaxed">
            Where social attention meets on-chain flow. The cross-reference catches
            narrative-driven moves before the chain does. Mentions, prior-period count,
            and 24h delta from{" "}
            <a href="https://www.elfa.ai/api" target="_blank" rel="noreferrer" className="link">
              Elfa AI
            </a>
            .
          </p>
          {isPlaceholder ? (
            <div className="mt-4 text-[11px] text-warn leading-relaxed border-l-2 border-warn pl-3">
              Set <code className="bg-line-2 px-1.5 py-0.5">ELFA_API_KEY</code> to enable.
              Free tier covers 1,000 calls/month.
            </div>
          ) : null}
        </div>

        <div className="border-b lg:border-b-0 lg:border-r border-line">
          <div className="px-5 py-3 eyebrow border-b border-line flex items-center justify-between">
            <span>Watched · 24h mindshare</span>
            <span className="text-[10px] text-dim">9 tokens</span>
          </div>
          {isPlaceholder ? (
            <div className="p-5 text-xs text-dim text-center">No data — add ELFA_API_KEY.</div>
          ) : (
            <div className="grid grid-cols-2">
              {snap.watched.map((t) => {
                const { text, tone } = fmtChange(t.changePct);
                const lit = t.mentions > 0;
                return (
                  <div
                    key={t.mappedTo}
                    className="border-r border-b border-line p-3.5 last-of-type:border-r-0 flex items-baseline justify-between gap-2"
                  >
                    <span className="text-sm font-medium tracking-tighter">{t.mappedTo}</span>
                    <span className="flex items-baseline gap-2 text-xs">
                      <span className={`tabular-nums ${lit ? "text-ink" : "text-dim"}`}>
                        {lit ? t.mentions.toLocaleString() : "—"}
                      </span>
                      {lit ? (
                        <span className={`tabular-nums ${tone}`}>{text}</span>
                      ) : (
                        <span className="text-dim/70">silent</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="px-5 py-3 eyebrow border-b border-line flex items-center justify-between">
            <span>Globally trending</span>
            <span className="text-[10px] text-dim">via Elfa</span>
          </div>
          {isPlaceholder ? (
            <div className="p-5 text-xs text-dim text-center">No data — add ELFA_API_KEY.</div>
          ) : (
            <div>
              {snap.trending.slice(0, 8).map((t: ElfaToken, i) => {
                const { text, tone } = fmtChange(t.changePct);
                return (
                  <div
                    key={t.token}
                    className="grid grid-cols-[28px_1fr_84px_64px] gap-3 px-5 py-2.5 items-center text-sm border-b border-line last:border-b-0 row-hover"
                  >
                    <span className="text-dim text-xs tabular-nums">{(i + 1).toString().padStart(2, "0")}</span>
                    <span className="font-medium tracking-tighter uppercase">${t.token}</span>
                    <span className="text-right tabular-nums text-xs text-ink-2">
                      {t.mentions.toLocaleString()} <span className="text-dim">mentions</span>
                    </span>
                    <span className={`text-right tabular-nums text-xs ${tone}`}>{text}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
