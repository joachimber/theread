/**
 * After deploying AgentIdentity.sol with `forge script`, run this to write
 * the deployed address + minted tokenId into the database so the dashboard
 * can render the on-chain identity.
 *
 * Usage:
 *   AGENT_IDENTITY_ADDRESS=0x... AGENT_TOKEN_ID=1 MINT_TX=0x... npm run register-agent
 */
import { db } from "../db/index.js";
import { agentRegistry } from "../db/schema.js";
import { log } from "../lib/log.js";
import { env } from "../lib/env.js";

async function main(): Promise<void> {
  const contractAddress = env.AGENT_IDENTITY_ADDRESS;
  const tokenId = env.AGENT_TOKEN_ID;
  const mintTx = process.env.MINT_TX;

  if (!contractAddress || !tokenId) {
    log.fatal("AGENT_IDENTITY_ADDRESS and AGENT_TOKEN_ID are required");
    process.exit(1);
  }
  if (!mintTx) {
    log.fatal("MINT_TX is required (the tx hash from the forge deploy)");
    process.exit(1);
  }

  await db
    .insert(agentRegistry)
    .values({
      contractAddress,
      tokenId,
      name: "The Read",
      metadataUri: "https://theread.xyz/agent.json",
      mintTx,
    })
    .onConflictDoNothing();

  log.info({ contractAddress, tokenId, mintTx }, "agent registered");
  process.exit(0);
}

main().catch((err) => {
  log.fatal({ err: String(err) }, "register-agent crashed");
  process.exit(1);
});
