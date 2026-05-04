/**
 * Backfill historical Mantle blocks. Run with:
 *   FROM_BLOCK=80000000 TO_BLOCK=80100000 npm run backfill
 */
import { processBlockRange } from "../indexer/transfers.js";
import { startPriceWorker, refreshPrices } from "../indexer/prices.js";
import { setCursor } from "../indexer/state.js";
import { publicClient } from "../lib/chain.js";
import { log } from "../lib/log.js";
import { env } from "../lib/env.js";

async function main(): Promise<void> {
  startPriceWorker();
  await refreshPrices();

  const fromEnv = process.env.FROM_BLOCK ? Number(process.env.FROM_BLOCK) : null;
  const toEnv = process.env.TO_BLOCK ? Number(process.env.TO_BLOCK) : null;
  const head = Number(await publicClient.getBlockNumber());
  const from = fromEnv ?? head - 1000;
  const to = toEnv ?? head;

  log.info({ from, to }, "backfill starting");
  const batch = env.INDEXER_BATCH_SIZE;
  let totalTransfers = 0;
  let totalWallets = 0;

  for (let cursor = from; cursor <= to; cursor += batch) {
    const end = Math.min(cursor + batch - 1, to);
    const t0 = performance.now();
    const result = await processBlockRange(cursor, end);
    const ms = (performance.now() - t0).toFixed(0);
    totalTransfers += result.transfers;
    totalWallets += result.uniqueWallets;
    log.info(
      { range: `${cursor}-${end}`, transfers: result.transfers, wallets: result.uniqueWallets, ms },
      "backfill batch",
    );
    await setCursor("transfers", end);
  }

  log.info({ totalTransfers, totalWallets }, "backfill done");
  process.exit(0);
}

main().catch((err) => {
  log.fatal({ err: String(err) }, "backfill crashed");
  process.exit(1);
});
