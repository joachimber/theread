import { sql, eq, and, desc, gte } from "drizzle-orm";
import { db } from "../db/index.js";
import { wallets, walletLabels, transfers } from "../db/schema.js";
import { publicClient } from "../lib/chain.js";
import { log } from "../lib/log.js";
import type { Address } from "viem";

/**
 * Seed labels for well-known Mantle entities.
 *
 * Addresses are sourced from public block-explorer tags and Mantle docs;
 * extend this list as new ones surface. Labels feed the narrator's prose
 * ("Bybit hot wallet just pulled $4M…") and the dashboard wallet table.
 */
export const SEED_LABELS: Array<{ address: string; label: string; metadata?: Record<string, unknown> }> = [
  // CEX hot wallets / deposit aggregators
  { address: "0xf89d7b9c864f589bbF53a82105107622B35EaA40", label: "Bybit Hot Wallet", metadata: { kind: "cex", venue: "Bybit" } },
  { address: "0xd3ad1b1bbf3ad6ad04a3eafd0b03ed6a05f73ce4", label: "OKX Hot Wallet", metadata: { kind: "cex", venue: "OKX" } },

  // Bridges
  { address: "0x4200000000000000000000000000000000000010", label: "L2 Standard Bridge", metadata: { kind: "bridge" } },
  { address: "0x95fC37A27a2f68e3A647CDc081F0A89bb47c3012", label: "Mantle Native Bridge", metadata: { kind: "bridge" } },

  // Protocol routers
  { address: "0xeaEE7EE68874218c3558b40063c42B82D3E7232a", label: "Merchant Moe Router", metadata: { kind: "router", venue: "Merchant Moe" } },
  { address: "0x319B69888b0d11cEC22caA5034e25FfFBDc88421", label: "Agni V3 Router", metadata: { kind: "router", venue: "Agni" } },
  { address: "0x9B36f165baB9ebe611d491180418d8De4b8f3a1f", label: "FusionX V3 Router", metadata: { kind: "router", venue: "FusionX" } },

  // Mantle ecosystem
  { address: "0xa9b72cCC9968aFeC98A96239B5AA48d828e8D827", label: "Mantle Treasury", metadata: { kind: "treasury" } },
  { address: "0xf9027C9f53AC0F00385d7Cb3d9f02ab2bbd31Cc7", label: "mETH Staking", metadata: { kind: "protocol", venue: "Mantle LSP" } },
];

export async function seedKnownLabels(): Promise<number> {
  let count = 0;
  for (const seed of SEED_LABELS) {
    const addr = seed.address.toLowerCase();
    try {
      await db
        .insert(walletLabels)
        .values({
          address: addr,
          label: seed.label,
          source: "manual:seed",
          confidence: 1,
          metadata: seed.metadata ?? null,
        })
        .onConflictDoNothing();
      count++;
    } catch (err) {
      log.warn({ err: String(err), addr }, "failed to seed label");
    }
  }
  return count;
}

/**
 * Label any wallet with deployed bytecode as a contract.
 * Cheap to run — single eth_getCode per unknown wallet.
 */
export async function labelContracts(limit = 200): Promise<number> {
  const candidates = await db
    .select({ address: wallets.address })
    .from(wallets)
    .where(eq(wallets.isContract, false))
    .limit(limit);

  let labeled = 0;
  for (const { address } of candidates) {
    try {
      const code = await publicClient.getCode({ address: address as Address });
      const isContract = !!code && code !== "0x";
      if (isContract) {
        await db.update(wallets).set({ isContract: true }).where(eq(wallets.address, address));
        await db
          .insert(walletLabels)
          .values({ address, label: "Contract", source: "heuristic:bytecode", confidence: 1 })
          .onConflictDoNothing();
        labeled++;
      }
    } catch (err) {
      log.debug({ err: String(err), address }, "code-check failed");
    }
  }
  return labeled;
}

/**
 * Tag the top-volume wallets with a "Whale" label.
 * Uses last-30d activity pulled directly from transfers, USD-denominated.
 */
export async function labelWhales(thresholdUsd = 1_000_000): Promise<number> {
  const rows = await db
    .select({
      address: transfers.fromAddr,
      vol: sql<number>`COALESCE(SUM(${transfers.usdValue}), 0)`,
    })
    .from(transfers)
    .where(gte(transfers.ts, sql`NOW() - INTERVAL '30 days'`))
    .groupBy(transfers.fromAddr)
    .having(sql`COALESCE(SUM(${transfers.usdValue}), 0) >= ${thresholdUsd}`);

  let count = 0;
  for (const row of rows) {
    try {
      await db
        .insert(walletLabels)
        .values({
          address: row.address,
          label: "Whale",
          source: "heuristic:volume30d",
          confidence: 0.7,
          metadata: { volume30dUsd: row.vol },
        })
        .onConflictDoNothing();
      count++;
    } catch (err) {
      log.debug({ err: String(err) }, "whale label failed");
    }
  }
  return count;
}

/**
 * Detect "MEV / arbitrage bot" pattern: many same-block opposite-direction transfers.
 */
export async function labelMevBots(minPairs = 25): Promise<number> {
  const rows = await db.execute<{ address: string; pairs: string }>(sql`
    WITH pairs AS (
      SELECT t1.from_addr AS address, t1.block_number
      FROM ${transfers} t1
      JOIN ${transfers} t2
        ON t1.block_number = t2.block_number
        AND t1.tx_hash = t2.tx_hash
        AND t1.token <> t2.token
        AND t1.from_addr = t2.to_addr
      WHERE t1.ts >= NOW() - INTERVAL '7 days'
    )
    SELECT address, COUNT(*)::text AS pairs
    FROM pairs
    GROUP BY address
    HAVING COUNT(*) >= ${minPairs}
  `);

  let count = 0;
  for (const row of rows as unknown as Array<{ address: string; pairs: string }>) {
    await db
      .insert(walletLabels)
      .values({
        address: row.address,
        label: "MEV Bot",
        source: "heuristic:same-block-arb",
        confidence: 0.6,
        metadata: { sameBlockPairs7d: Number(row.pairs) },
      })
      .onConflictDoNothing();
    count++;
  }
  return count;
}

export async function getLabelsForWallet(address: string): Promise<Array<{ label: string; source: string; confidence: number }>> {
  return db
    .select({
      label: walletLabels.label,
      source: walletLabels.source,
      confidence: walletLabels.confidence,
    })
    .from(walletLabels)
    .where(eq(walletLabels.address, address.toLowerCase()))
    .orderBy(desc(walletLabels.confidence));
}

/** Run all heuristic labelers — meant to be invoked on a slow schedule. */
export async function runHeuristicLabelers(): Promise<void> {
  const seeded = await seedKnownLabels();
  const contracts = await labelContracts(500);
  const whales = await labelWhales();
  const mev = await labelMevBots();
  log.info({ seeded, contracts, whales, mev }, "labels updated");
}
