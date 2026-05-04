import { Stat } from "../../components/Stat";
import { AutoRefresh } from "../../components/AutoRefresh";
import { getAgentSnapshot } from "../../lib/queries";
import { fmtRel } from "../../lib/format";

export const dynamic = "force-dynamic";

export default async function AgentPage() {
  let snap;
  let dbErr: string | null = null;
  try {
    snap = await getAgentSnapshot();
  } catch (err) {
    dbErr = String(err);
    snap = { identity: null, recent: [], total: 0, attested: 0 };
  }
  const { identity, recent, total, attested } = snap;
  const ratio = total > 0 ? Math.round((attested / total) * 100) : 0;

  return (
    <>
      <AutoRefresh ms={10_000} />
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Agent identity</h1>
        <p className="text-sm text-dim mt-1">
          ERC-8004 record for The Read. Every alert hash gets pinned on-chain — verifiable
          provenance for the agent&apos;s track record.
        </p>
      </div>

      {dbErr ? (
        <div className="text-sm text-warn mb-8 border border-line p-4 bg-panel">
          Database error: {dbErr}
        </div>
      ) : null}

      <section className="grid grid-cols-2 md:grid-cols-4 gap-px bg-line mb-8">
        <Stat label="Total alerts" value={total.toLocaleString()} />
        <Stat
          label="On-chain attestations"
          value={attested.toLocaleString()}
          sub={`${ratio}% of alerts`}
          tone={ratio === 100 ? "up" : "default"}
        />
        <Stat
          label="Token ID"
          value={identity?.tokenId ?? "—"}
          sub={identity ? "minted" : "not yet minted"}
        />
        <Stat
          label="Network"
          value="Mantle"
          sub={identity ? "deployed" : "deploy via foundry"}
        />
      </section>

      <section className="mb-8 border border-line p-4 bg-panel">
        <div className="text-[10px] uppercase tracking-widest text-dim mb-2">Identity contract</div>
        {identity ? (
          <a
            href={`https://mantlescan.xyz/address/${identity.contractAddress}`}
            target="_blank"
            rel="noreferrer"
            className="text-accent break-all hover:underline font-mono text-sm"
          >
            {identity.contractAddress}
          </a>
        ) : (
          <span className="text-dim text-sm">
            Deploy <code className="text-ink">contracts/src/AgentIdentity.sol</code> with{" "}
            <code className="text-ink">forge script script/Deploy.s.sol</code>, then set{" "}
            <code className="text-ink">AGENT_IDENTITY_ADDRESS</code> in <code className="text-ink">.env</code>.
          </span>
        )}
      </section>

      <section>
        <div className="border-b border-line pb-2 mb-3">
          <h2 className="text-xs uppercase tracking-widest text-dim">Attestation log</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-widest text-dim">
            <tr>
              <th className="text-left py-2 px-1">When</th>
              <th className="text-left py-2 px-1">Headline</th>
              <th className="text-left py-2 px-1">Hash</th>
              <th className="text-right py-2 px-1">Status</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((a) => (
              <tr key={a.id} className="border-t border-line">
                <td className="py-2 px-1 text-dim">{fmtRel(a.createdAt)}</td>
                <td className="py-2 px-1">{a.headline}</td>
                <td className="py-2 px-1 text-dim font-mono text-xs">{a.alertHash.slice(0, 16)}…</td>
                <td className="text-right py-2 px-1">
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
                    <span className="text-dim">pending</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {recent.length === 0 ? (
          <div className="text-sm text-dim py-12 text-center border border-line mt-4">
            No attestations yet. Run <code className="text-ink">npm run seed</code> for demo data.
          </div>
        ) : null}
      </section>
    </>
  );
}
