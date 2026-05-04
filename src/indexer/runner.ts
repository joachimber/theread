import { publicClient } from "../lib/chain.js";
import { env } from "../lib/env.js";
import { log } from "../lib/log.js";
import { bumpCursor, getStartBlock } from "./state.js";
import { processBlockRange } from "./transfers.js";
import { startPriceWorker } from "./prices.js";

export interface IndexerStats {
  startedAt: Date;
  lastBlock: number;
  headBlock: number;
  processedBlocks: number;
  processedTransfers: number;
  processedWallets: number;
  lastError?: string;
}

const stats: IndexerStats = {
  startedAt: new Date(),
  lastBlock: 0,
  headBlock: 0,
  processedBlocks: 0,
  processedTransfers: 0,
  processedWallets: 0,
};

export function getIndexerStats(): IndexerStats {
  return { ...stats };
}

export async function runIndexer(): Promise<void> {
  startPriceWorker();

  const batchSize = env.INDEXER_BATCH_SIZE;
  let cursor = await getStartBlock(env.INDEXER_START_BLOCK, batchSize);
  log.info({ cursor, batchSize }, "indexer starting");

  let stopping = false;
  process.on("SIGINT", () => { stopping = true; });
  process.on("SIGTERM", () => { stopping = true; });

  while (!stopping) {
    try {
      const head = Number(await publicClient.getBlockNumber());
      stats.headBlock = head;

      if (cursor > head) {
        await sleep(env.INDEXER_POLL_MS);
        continue;
      }

      const toBlock = Math.min(cursor + batchSize - 1, head);
      const t0 = performance.now();
      const result = await processBlockRange(cursor, toBlock);
      const ms = (performance.now() - t0).toFixed(0);

      stats.lastBlock = toBlock;
      stats.processedBlocks += toBlock - cursor + 1;
      stats.processedTransfers += result.transfers;
      stats.processedWallets += result.uniqueWallets;

      await bumpCursor("transfers", toBlock);

      log.info(
        {
          range: `${cursor}-${toBlock}`,
          blocks: toBlock - cursor + 1,
          transfers: result.transfers,
          wallets: result.uniqueWallets,
          ms,
          lag: head - toBlock,
        },
        "indexed",
      );

      cursor = toBlock + 1;

      if (toBlock >= head) {
        await sleep(env.INDEXER_POLL_MS);
      }
    } catch (err) {
      stats.lastError = String(err);
      log.error({ err: String(err) }, "indexer batch failed");
      await sleep(5_000);
    }
  }

  log.info("indexer stopped");
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
