import { eq, sql, and, gte, isNotNull } from "drizzle-orm";
import { createWalletClient, http, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { db } from "../db/index.js";
import { alerts as alertsTable } from "../db/schema.js";
import { mantle } from "../lib/chain.js";
import { agentIdentityAbi } from "../lib/abi.js";
import { env } from "../lib/env.js";
import { log } from "../lib/log.js";

/**
 * Record an alert's hash on-chain via the ERC-8004 agent identity contract.
 *
 * Cost-bounded: only attests when (1) the agent identity is configured,
 * (2) severity >= ATTESTATION_SEVERITY_FLOOR (default 3), and (3) we're
 * under the daily cap (default 30 attestations / 24h). The detector still
 * produces every alert and pushes them to Telegram + the dashboard — only
 * the high-signal subset gets pinned on-chain so we don't drain the gas
 * wallet on routine noise.
 */
export async function recordAttestation(
  alertId: number,
  alertHash: string,
  severity = 5,
): Promise<void> {
  if (!env.AGENT_IDENTITY_ADDRESS || !env.AGENT_TOKEN_ID || !env.DEPLOYER_PRIVATE_KEY) {
    log.debug({ alertId }, "attestation skipped (agent identity not configured)");
    return;
  }

  if (severity < env.ATTESTATION_SEVERITY_FLOOR) {
    log.debug(
      { alertId, severity, floor: env.ATTESTATION_SEVERITY_FLOOR },
      "attestation skipped (below severity floor)",
    );
    return;
  }

  // 24h rolling cap — count attestations actually written on-chain
  const rows = (await db.execute<{ c: string }>(sql`
    SELECT COUNT(*)::text AS c
    FROM ${alertsTable}
    WHERE attestation_tx IS NOT NULL
      AND created_at >= NOW() - INTERVAL '24 hours'
  `)) as unknown as Array<{ c: string }>;
  const todayCount = Number(rows[0]?.c ?? 0);
  if (todayCount >= env.ATTESTATION_DAILY_CAP) {
    log.warn(
      { alertId, todayCount, cap: env.ATTESTATION_DAILY_CAP },
      "attestation skipped (daily cap reached)",
    );
    return;
  }

  try {
    const account = privateKeyToAccount(env.DEPLOYER_PRIVATE_KEY as Hex);
    const wallet = createWalletClient({
      account,
      chain: mantle,
      transport: http(env.MANTLE_RPC_URL),
    });

    const uri = `https://thereadmantle.vercel.app/agent`;
    const txHash = await wallet.writeContract({
      address: env.AGENT_IDENTITY_ADDRESS as `0x${string}`,
      abi: agentIdentityAbi,
      functionName: "recordAlert",
      args: [BigInt(env.AGENT_TOKEN_ID), alertHash as Hex, uri],
    });

    await db.update(alertsTable).set({ attestationTx: txHash }).where(eq(alertsTable.id, alertId));
    log.info({ alertId, txHash, todayCount: todayCount + 1 }, "attestation recorded on Mantle");
  } catch (err) {
    log.warn({ err: String(err), alertId }, "attestation failed");
  }
}
