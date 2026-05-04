import { sql } from "drizzle-orm";
import type { Address, Log } from "viem";
import { decodeEventLog, parseAbiItem } from "viem";
import { db } from "../db/index.js";
import { transfers, blocks, wallets } from "../db/schema.js";
import { publicClient } from "../lib/chain.js";
import { erc20Abi } from "../lib/abi.js";
import { findToken, WATCHED_ADDRESSES } from "../lib/tokens.js";
import { getCachedPriceBySymbol } from "./prices.js";
import { log } from "../lib/log.js";

const TRANSFER_EVENT = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

interface ParsedTransfer {
  blockNumber: number;
  logIndex: number;
  txHash: string;
  token: string;
  fromAddr: string;
  toAddr: string;
  rawAmount: string;
  amount: number;
  usdValue: number | null;
  ts: Date;
}

export async function fetchTransferLogs(fromBlock: bigint, toBlock: bigint): Promise<Log[]> {
  if (WATCHED_ADDRESSES.length === 0) return [];
  return publicClient.getLogs({
    address: WATCHED_ADDRESSES as Address[],
    event: TRANSFER_EVENT,
    fromBlock,
    toBlock,
  });
}

export async function processBlockRange(fromBlock: number, toBlock: number): Promise<{
  transfers: number;
  uniqueWallets: number;
}> {
  const logs = await fetchTransferLogs(BigInt(fromBlock), BigInt(toBlock));
  if (logs.length === 0) return { transfers: 0, uniqueWallets: 0 };

  // Pull block timestamps for the range — bulk fetch and cache.
  const blockNums = [...new Set(logs.map((l) => Number(l.blockNumber)))];
  const blockMap = new Map<number, Date>();

  await Promise.all(
    blockNums.map(async (n) => {
      try {
        const blk = await publicClient.getBlock({ blockNumber: BigInt(n) });
        blockMap.set(n, new Date(Number(blk.timestamp) * 1000));
      } catch (err) {
        log.warn({ err: String(err), block: n }, "failed to fetch block");
      }
    }),
  );

  const blockRows = [...blockMap.entries()].map(([n, ts]) => ({
    number: n,
    hash: logs.find((l) => Number(l.blockNumber) === n)!.blockHash!,
    timestamp: ts,
  }));
  if (blockRows.length > 0) {
    await db.insert(blocks).values(blockRows).onConflictDoNothing();
  }

  const parsed: ParsedTransfer[] = [];
  const walletAddrs = new Set<string>();

  for (const lg of logs) {
    try {
      const decoded = decodeEventLog({
        abi: erc20Abi,
        data: lg.data,
        topics: lg.topics,
      });
      if (decoded.eventName !== "Transfer") continue;
      const { from, to, value } = decoded.args as { from: string; to: string; value: bigint };

      const tokenInfo = findToken(lg.address);
      if (!tokenInfo) continue;

      const amount = Number(value) / 10 ** tokenInfo.decimals;
      const price = tokenInfo.coingeckoId ? getCachedPriceBySymbol(tokenInfo.symbol) : null;
      const usdValue = price ? amount * price : null;
      const ts = blockMap.get(Number(lg.blockNumber)) ?? new Date();

      parsed.push({
        blockNumber: Number(lg.blockNumber),
        logIndex: lg.logIndex!,
        txHash: lg.transactionHash!,
        token: lg.address.toLowerCase(),
        fromAddr: from.toLowerCase(),
        toAddr: to.toLowerCase(),
        rawAmount: value.toString(),
        amount,
        usdValue,
        ts,
      });

      walletAddrs.add(from.toLowerCase());
      walletAddrs.add(to.toLowerCase());
    } catch (err) {
      log.debug({ err: String(err) }, "skip undecodable log");
    }
  }

  if (parsed.length > 0) {
    // Chunk inserts to keep params under postgres limits (~65k).
    const CHUNK = 1000;
    for (let i = 0; i < parsed.length; i += CHUNK) {
      const chunk = parsed.slice(i, i + CHUNK);
      await db.insert(transfers).values(chunk).onConflictDoNothing();
    }
  }

  // Upsert wallet rows (first_seen / last_seen / volume rolled up).
  if (walletAddrs.size > 0) {
    const ts = new Date();
    const tsIso = ts.toISOString();
    const walletRows = [...walletAddrs].map((addr) => {
      const incoming = parsed.filter((p) => p.toAddr === addr);
      const outgoing = parsed.filter((p) => p.fromAddr === addr);
      const usdVol = [...incoming, ...outgoing].reduce((acc, t) => acc + (t.usdValue ?? 0), 0);
      return {
        address: addr,
        firstSeen: ts,
        lastSeen: ts,
        txCount: incoming.length + outgoing.length,
        totalVolumeUsd: usdVol,
        score: 0,
        isContract: false,
      };
    });

    const CHUNK = 500;
    for (let i = 0; i < walletRows.length; i += CHUNK) {
      const chunk = walletRows.slice(i, i + CHUNK);
      await db
        .insert(wallets)
        .values(chunk)
        .onConflictDoUpdate({
          target: wallets.address,
          set: {
            lastSeen: sql.raw(`'${tsIso}'::timestamptz`),
            txCount: sql`${wallets.txCount} + EXCLUDED.tx_count`,
            totalVolumeUsd: sql`${wallets.totalVolumeUsd} + EXCLUDED.total_volume_usd`,
          },
        });
    }
  }

  return { transfers: parsed.length, uniqueWallets: walletAddrs.size };
}
