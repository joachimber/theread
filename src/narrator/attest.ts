import { eq } from "drizzle-orm";
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
 * Best-effort, fire-and-forget — failures don't block the alert pipeline.
 *
 * Attestation provides verifiable provenance: the moment a Detection becomes
 * an Alert, its content hash is fixed and can be checked against the
 * on-chain log later. This is the demo's "ERC-8004 reputation" hook.
 */
export async function recordAttestation(alertId: number, alertHash: string): Promise<void> {
  if (!env.AGENT_IDENTITY_ADDRESS || !env.AGENT_TOKEN_ID || !env.DEPLOYER_PRIVATE_KEY) {
    log.debug({ alertId }, "attestation skipped (missing agent identity config)");
    return;
  }

  try {
    const account = privateKeyToAccount(env.DEPLOYER_PRIVATE_KEY as Hex);
    const wallet = createWalletClient({
      account,
      chain: mantle,
      transport: http(env.MANTLE_RPC_URL),
    });

    const uri = `https://theread.xyz/alert/${alertId}`;
    const txHash = await wallet.writeContract({
      address: env.AGENT_IDENTITY_ADDRESS as `0x${string}`,
      abi: agentIdentityAbi,
      functionName: "recordAlert",
      args: [BigInt(env.AGENT_TOKEN_ID), alertHash as Hex, uri],
    });

    await db.update(alertsTable).set({ attestationTx: txHash }).where(eq(alertsTable.id, alertId));
    log.info({ alertId, txHash }, "attestation recorded on Mantle");
  } catch (err) {
    log.warn({ err: String(err), alertId }, "attestation failed");
  }
}
