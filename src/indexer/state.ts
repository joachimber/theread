import { eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { indexerCursor } from "../db/schema.js";
import { publicClient } from "../lib/chain.js";

export async function getCursor(name: string): Promise<number | null> {
  const rows = await db.select().from(indexerCursor).where(eq(indexerCursor.name, name)).limit(1);
  return rows[0]?.blockNumber ?? null;
}

export async function setCursor(name: string, blockNumber: number): Promise<void> {
  await db
    .insert(indexerCursor)
    .values({ name, blockNumber })
    .onConflictDoUpdate({
      target: indexerCursor.name,
      set: { blockNumber, updatedAt: sql`NOW()` },
    });
}

export async function bumpCursor(name: string, blockNumber: number): Promise<void> {
  await db
    .insert(indexerCursor)
    .values({ name, blockNumber })
    .onConflictDoUpdate({
      target: indexerCursor.name,
      set: {
        blockNumber: sql`GREATEST(${indexerCursor.blockNumber}, ${blockNumber})`,
        updatedAt: sql`NOW()`,
      },
    });
}

export async function getStartBlock(envStart: number | undefined, lookback = 100): Promise<number> {
  const stored = await getCursor("transfers");
  if (stored !== null) return stored + 1;
  if (envStart) return envStart;
  const head = await publicClient.getBlockNumber();
  return Number(head) - lookback;
}
