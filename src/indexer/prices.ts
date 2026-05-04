import { sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { prices } from "../db/schema.js";
import { COINGECKO_IDS, COINGECKO_TO_SYMBOL } from "../lib/tokens.js";
import { log } from "../lib/log.js";

const CG_URL = "https://api.coingecko.com/api/v3/simple/price";

/**
 * In-memory price cache used during indexing. Refreshed on a schedule.
 */
const cache = new Map<string, { price: number; ts: number }>();

export function getCachedPriceBySymbol(symbol: string): number | null {
  const entry = cache.get(symbol.toUpperCase());
  return entry?.price ?? null;
}

export async function refreshPrices(): Promise<void> {
  if (COINGECKO_IDS.length === 0) return;
  const url = `${CG_URL}?ids=${COINGECKO_IDS.join(",")}&vs_currencies=usd`;
  let body: Record<string, { usd: number }>;
  try {
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) {
      log.warn({ status: res.status }, "coingecko refresh failed");
      return;
    }
    body = (await res.json()) as Record<string, { usd: number }>;
  } catch (err) {
    log.warn({ err: String(err) }, "coingecko fetch error");
    return;
  }

  const ts = new Date();
  const rows = Object.entries(body).flatMap(([id, v]) => {
    if (!v?.usd) return [];
    const symbol = COINGECKO_TO_SYMBOL[id] ?? id;
    cache.set(symbol.toUpperCase(), { price: v.usd, ts: ts.getTime() });
    return [{ coingeckoId: id, symbol, priceUsd: v.usd, ts }];
  });

  if (rows.length === 0) return;
  await db
    .insert(prices)
    .values(rows)
    .onConflictDoNothing({ target: [prices.coingeckoId, prices.ts] });

  log.debug({ count: rows.length }, "prices refreshed");
}

/** Drop price rows older than `days`. */
export async function pruneOldPrices(days = 14): Promise<void> {
  await db.execute(sql`DELETE FROM prices WHERE ts < NOW() - INTERVAL '${sql.raw(String(days))} days'`);
}

let timer: NodeJS.Timeout | null = null;
export function startPriceWorker(intervalMs = 60_000): void {
  if (timer) return;
  void refreshPrices();
  timer = setInterval(() => void refreshPrices(), intervalMs);
}

export function stopPriceWorker(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
