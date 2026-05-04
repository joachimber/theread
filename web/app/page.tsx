import { Stat } from "../components/Stat";
import { AlertRow } from "../components/AlertRow";
import { LiveDot } from "../components/LiveDot";
import { AutoRefresh } from "../components/AutoRefresh";
import { getStats, getRecentAlerts, getTokenVolumes24h } from "../lib/queries";
import { fmtUsd, fmtAddr } from "../lib/format";
import { TOKENS_BY_ADDRESS } from "../../src/lib/tokens";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function symbolFor(addr: string): string {
  return TOKENS_BY_ADDRESS.get(addr.toLowerCase())?.symbol ?? fmtAddr(addr);
}

export default async function HomePage() {
  const [stats, alerts, tokenVols] = await Promise.all([
    getStats().catch(() => null),
    getRecentAlerts(40).catch(() => []),
    getTokenVolumes24h().catch(() => []),
  ]);

  if (!stats) {
    return (
      <div className="text-sm text-dim">
        Database not reachable — set <code className="text-ink">DATABASE_URL</code> and run{" "}
        <code className="text-ink">npm run db:push</code>.
      </div>
    );
  }

  const lagOk = stats.indexerLag < 60;

  return (
    <>
      <AutoRefresh ms={5000} />

      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Live feed</h1>
          <p className="text-sm text-dim mt-1">
            Every Mantle move worth talking about — explained in one sentence.
          </p>
        </div>
        <LiveDot lastTs={stats.lastBlockTs ? stats.lastBlockTs.toString() : null} />
      </div>

      <section className="grid grid-cols-2 md:grid-cols-5 gap-px bg-line mb-8">
        <Stat
          label="Alerts · 24h"
          value={String(stats.alertsToday)}
          sub={`${stats.alertsAttested} attested on-chain`}
        />
        <Stat
          label="Wallets tracked"
          value={stats.walletsTracked.toLocaleString()}
        />
        <Stat
          label="Transfer volume · 24h"
          value={fmtUsd(stats.transfers24hUsd)}
          sub={
            stats.topToken
              ? `${symbolFor(stats.topToken.symbol ?? "")} led with ${fmtUsd(stats.topToken.volumeUsd)}`
              : undefined
          }
        />
        <Stat
          label="Indexer lag"
          value={`${Math.round(stats.indexerLag)}s`}
          tone={lagOk ? "up" : "warn"}
          sub={lagOk ? "in sync" : "catching up"}
        />
        <Stat label="Agent identity" value="ERC-8004" sub="The Read · #1" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div>
          <div className="flex items-center justify-between mb-3 border-b border-line pb-2">
            <h2 className="text-xs uppercase tracking-widest text-dim">Recent alerts</h2>
            <span className="text-xs text-dim">{alerts.length} shown</span>
          </div>
          {alerts.length === 0 ? (
            <div className="text-sm text-dim py-12 text-center border border-line">
              No alerts yet. The indexer needs a few minutes of data before the detector triggers.
              <br />
              Run <code className="text-ink">npm run seed</code> to populate demo alerts.
            </div>
          ) : (
            alerts.map((a) => <AlertRow key={a.id} a={{ ...a, txUrl: a.txUrl ?? null, attestationTx: a.attestationTx ?? null }} />)
          )}
        </div>

        <aside>
          <div className="border-b border-line pb-2 mb-3">
            <h2 className="text-xs uppercase tracking-widest text-dim">Top tokens · 24h</h2>
          </div>
          {tokenVols.length === 0 ? (
            <div className="text-sm text-dim">No volume yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-widest text-dim">
                <tr>
                  <th className="text-left pb-2">Token</th>
                  <th className="text-right pb-2">Volume</th>
                  <th className="text-right pb-2">Tx</th>
                </tr>
              </thead>
              <tbody>
                {tokenVols.map((t) => (
                  <tr key={t.token} className="border-t border-line">
                    <td className="py-2">{symbolFor(t.token)}</td>
                    <td className="text-right py-2">{fmtUsd(t.volumeUsd)}</td>
                    <td className="text-right py-2 text-dim">{t.transfers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </aside>
      </section>
    </>
  );
}
