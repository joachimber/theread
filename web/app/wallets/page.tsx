import { AutoRefresh } from "../../components/AutoRefresh";
import { getTopWallets } from "../../lib/queries";
import { fmtUsd, fmtAddr, fmtRel } from "../../lib/format";

export const dynamic = "force-dynamic";

export default async function WalletsPage() {
  const wallets = await getTopWallets(100).catch(() => []);

  return (
    <>
      <AutoRefresh ms={10_000} />
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Wallets</h1>
          <p className="text-sm text-dim mt-1">
            Top movers on Mantle by 30d volume — labels feed every alert narrative.
          </p>
        </div>
        <span className="text-xs text-dim">{wallets.length} wallets</span>
      </div>

      <table className="w-full text-sm">
        <thead className="text-[10px] uppercase tracking-widest text-dim border-b border-line">
          <tr>
            <th className="text-left py-2 px-1">#</th>
            <th className="text-left py-2 px-1">Address</th>
            <th className="text-left py-2 px-1">Labels</th>
            <th className="text-right py-2 px-1">Volume 30d</th>
            <th className="text-right py-2 px-1">Tx</th>
            <th className="text-right py-2 px-1">Last seen</th>
          </tr>
        </thead>
        <tbody>
          {wallets.map((w, i) => (
            <tr key={w.address} className="border-t border-line hover:bg-panel">
              <td className="py-2 px-1 text-dim">{i + 1}</td>
              <td className="py-2 px-1">
                <a
                  href={`https://mantlescan.xyz/address/${w.address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-accent"
                >
                  {fmtAddr(w.address)} ↗
                </a>
              </td>
              <td className="py-2 px-1 text-dim">
                {w.labels.length === 0 ? (
                  <span className="text-dim/60">—</span>
                ) : (
                  w.labels.map((l) => (
                    <span key={l} className="inline-block border border-line px-1 mr-1 text-xs">
                      {l}
                    </span>
                  ))
                )}
              </td>
              <td className="text-right py-2 px-1 font-semibold">{fmtUsd(w.volumeUsd)}</td>
              <td className="text-right py-2 px-1 text-dim">{w.txCount.toLocaleString()}</td>
              <td className="text-right py-2 px-1 text-dim">{fmtRel(w.lastSeen)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {wallets.length === 0 ? (
        <div className="text-sm text-dim py-12 text-center border border-line mt-4">
          No wallets indexed yet. Start the indexer with <code className="text-ink">npm run dev</code>.
        </div>
      ) : null}
    </>
  );
}
