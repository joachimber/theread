import { sql, desc, and, gte, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { transfers, prices, walletLabels } from "../db/schema.js";
import { TOKENS } from "../lib/tokens.js";
import { fmtUsd, fmtPct } from "../lib/format.js";
import { env } from "../lib/env.js";
import type { Detection, Actor } from "./types.js";

/** ---------- helpers ---------- */

async function recentLabels(addresses: string[]): Promise<Map<string, string[]>> {
  if (addresses.length === 0) return new Map();
  const lower = addresses.map((a) => a.toLowerCase());
  const rows = await db
    .select({ address: walletLabels.address, label: walletLabels.label })
    .from(walletLabels)
    .where(sql`${walletLabels.address} = ANY(${sql.raw(`ARRAY[${lower.map((a) => `'${a}'`).join(",")}]`)})`);
  const out = new Map<string, string[]>();
  for (const r of rows) {
    const list = out.get(r.address) ?? [];
    list.push(r.label);
    out.set(r.address, list);
  }
  return out;
}

const NOISE_LABELS = new Set([
  "Contract",
  "L2 Standard Bridge",
  "Mantle Native Bridge",
  "Merchant Moe Router",
  "Agni V3 Router",
  "FusionX V3 Router",
]);

function isInteresting(labels: string[]): boolean {
  if (labels.length === 0) return true;
  return !labels.every((l) => NOISE_LABELS.has(l));
}

/** ---------- price spike ---------- */

export async function detectPriceSpikes(): Promise<Detection[]> {
  const detections: Detection[] = [];
  const windowMin = env.PRICE_SPIKE_WINDOW_MIN;
  const thresholdPct = env.PRICE_SPIKE_PCT;

  for (const tok of Object.values(TOKENS)) {
    if (!tok.coingeckoId) continue;
    const rows = await db
      .select({ priceUsd: prices.priceUsd, ts: prices.ts })
      .from(prices)
      .where(
        and(
          eq(prices.coingeckoId, tok.coingeckoId),
          gte(prices.ts, sql`NOW() - INTERVAL '${sql.raw(`${windowMin * 2} minutes`)}'`),
        ),
      )
      .orderBy(desc(prices.ts))
      .limit(60);

    if (rows.length < 2) continue;
    const latest = rows[0]!;
    const cutoff = Date.now() - windowMin * 60_000;
    const baseline = rows.find((r) => r.ts.getTime() <= cutoff) ?? rows[rows.length - 1]!;

    const pct = ((latest.priceUsd - baseline.priceUsd) / baseline.priceUsd) * 100;
    if (Math.abs(pct) < thresholdPct) continue;

    const direction = pct > 0 ? "up" : "down";
    const severity = Math.min(5, 1 + Math.floor(Math.abs(pct) / thresholdPct));

    const flow = await topMoversForToken(tok.address.toLowerCase(), windowMin);

    detections.push({
      kind: "price_spike",
      severity,
      token: tok.symbol,
      headline: `${tok.symbol} ${direction} ${fmtPct(pct)} in ${windowMin}m`,
      windowMin,
      metrics: {
        pct,
        priceFrom: baseline.priceUsd,
        priceTo: latest.priceUsd,
        windowMin,
      },
      actors: flow.actors,
      txExamples: flow.txExamples,
      cooldownKey: `price_spike:${tok.symbol}:${direction}`,
    });
  }
  return detections;
}

/** ---------- volume spike ---------- */

export async function detectVolumeSpikes(): Promise<Detection[]> {
  const detections: Detection[] = [];
  const sigmaThreshold = env.VOLUME_SPIKE_SIGMA;

  for (const tok of Object.values(TOKENS)) {
    const rows = await db.execute<{
      bucket: Date;
      vol: number;
    }>(sql`
      SELECT date_trunc('hour', ts) AS bucket, COALESCE(SUM(usd_value),0) AS vol
      FROM ${transfers}
      WHERE token = ${tok.address.toLowerCase()}
        AND ts >= NOW() - INTERVAL '24 hours'
      GROUP BY bucket
      ORDER BY bucket DESC
    `);
    const arr = rows as unknown as Array<{ bucket: Date; vol: number }>;
    if (arr.length < 6) continue;

    const current = Number(arr[0]!.vol);
    const baseline = arr.slice(1).map((r) => Number(r.vol));
    if (baseline.length === 0) continue;
    const mean = baseline.reduce((a, b) => a + b, 0) / baseline.length;
    const variance = baseline.reduce((a, b) => a + (b - mean) ** 2, 0) / baseline.length;
    const std = Math.sqrt(variance) || 1;
    const sigma = (current - mean) / std;

    if (sigma < sigmaThreshold || current < 50_000) continue;

    const flow = await topMoversForToken(tok.address.toLowerCase(), 60);
    const severity = Math.min(5, 1 + Math.floor(sigma / sigmaThreshold));

    detections.push({
      kind: "volume_spike",
      severity,
      token: tok.symbol,
      headline: `${tok.symbol} volume ${fmtUsd(current)} (${sigma.toFixed(1)}σ above 24h avg)`,
      windowMin: 60,
      metrics: {
        currentUsd: current,
        meanUsd: mean,
        sigma,
      },
      actors: flow.actors,
      txExamples: flow.txExamples,
      cooldownKey: `volume_spike:${tok.symbol}`,
    });
  }
  return detections;
}

/** ---------- whale move ---------- */

export async function detectWhaleMoves(): Promise<Detection[]> {
  const threshold = env.WHALE_USD_THRESHOLD;
  const since = sql`NOW() - INTERVAL '5 minutes'`;
  const rows = await db
    .select({
      blockNumber: transfers.blockNumber,
      txHash: transfers.txHash,
      token: transfers.token,
      fromAddr: transfers.fromAddr,
      toAddr: transfers.toAddr,
      usdValue: transfers.usdValue,
      amount: transfers.amount,
      ts: transfers.ts,
    })
    .from(transfers)
    .where(and(gte(transfers.ts, since), gte(transfers.usdValue, threshold)))
    .orderBy(desc(transfers.usdValue))
    .limit(20);

  if (rows.length === 0) return [];

  const wallets = [...new Set(rows.flatMap((r) => [r.fromAddr, r.toAddr]))];
  const labels = await recentLabels(wallets);
  const out: Detection[] = [];

  for (const r of rows) {
    const fromLabels = labels.get(r.fromAddr) ?? [];
    const toLabels = labels.get(r.toAddr) ?? [];
    if (!isInteresting(fromLabels) && !isInteresting(toLabels)) continue;

    const tokInfo = Object.values(TOKENS).find(
      (t) => t.address.toLowerCase() === r.token.toLowerCase(),
    );
    const symbol = tokInfo?.symbol ?? r.token.slice(0, 6);
    const usd = r.usdValue ?? 0;

    const direction = fromLabels.some((l) => l.includes("CEX")) ? "withdraw"
      : toLabels.some((l) => l.includes("CEX")) ? "deposit"
      : "transfer";

    const actors: Actor[] = [
      { address: r.fromAddr, labels: fromLabels, usdValue: usd, action: "out", token: symbol },
      { address: r.toAddr, labels: toLabels, usdValue: usd, action: "in", token: symbol },
    ];

    const severity = Math.min(5, 1 + Math.floor(usd / threshold));

    out.push({
      kind: "whale_move",
      severity,
      token: symbol,
      headline: `${fmtUsd(usd)} ${symbol} ${direction}`,
      windowMin: 5,
      metrics: { usd, amount: r.amount },
      actors,
      txExamples: [r.txHash],
      // Dedupe by (kind, token, from, to). Recurring market-makers running
      // the same (from→to) swap pair get silenced for the cooldown window
      // regardless of amount drift. A different wallet doing a new $3.5M
      // move still alerts (that's actual news).
      cooldownKey: `whale_move:${symbol}:${r.fromAddr.slice(0, 10)}-${r.toAddr.slice(0, 10)}`,
    });
  }

  return out;
}

/** ---------- top movers for a token ----------
 * Returns the largest net buyers/sellers in the window, with labels. */

async function topMoversForToken(token: string, windowMin: number): Promise<{
  actors: Actor[];
  txExamples: string[];
}> {
  const rows = await db.execute<{
    address: string;
    inflow: number;
    outflow: number;
    last_tx: string;
  }>(sql`
    WITH tx AS (
      SELECT * FROM ${transfers}
      WHERE token = ${token}
        AND ts >= NOW() - INTERVAL '${sql.raw(`${windowMin} minutes`)}'
    )
    SELECT
      addr.address,
      COALESCE(SUM(CASE WHEN tx.to_addr = addr.address THEN tx.usd_value END), 0) AS inflow,
      COALESCE(SUM(CASE WHEN tx.from_addr = addr.address THEN tx.usd_value END), 0) AS outflow,
      MAX(tx.tx_hash) AS last_tx
    FROM tx
    JOIN LATERAL (VALUES (tx.from_addr), (tx.to_addr)) AS addr(address) ON TRUE
    GROUP BY addr.address
    ORDER BY GREATEST(
      COALESCE(SUM(CASE WHEN tx.to_addr = addr.address THEN tx.usd_value END), 0),
      COALESCE(SUM(CASE WHEN tx.from_addr = addr.address THEN tx.usd_value END), 0)
    ) DESC
    LIMIT 10
  `);

  const arr = rows as unknown as Array<{
    address: string;
    inflow: number;
    outflow: number;
    last_tx: string;
  }>;

  if (arr.length === 0) return { actors: [], txExamples: [] };

  const labels = await recentLabels(arr.map((a) => a.address));
  const actors: Actor[] = arr
    .map((r) => {
      const inflow = Number(r.inflow);
      const outflow = Number(r.outflow);
      const action = inflow >= outflow ? "buy" : "sell";
      const usdValue = Math.max(inflow, outflow);
      return {
        address: r.address,
        labels: labels.get(r.address) ?? [],
        usdValue,
        action,
      };
    })
    .filter((a) => isInteresting(a.labels) && a.usdValue > 1_000)
    .slice(0, 5);

  const txExamples = arr
    .map((r) => r.last_tx)
    .filter((tx): tx is string => Boolean(tx))
    .slice(0, 3);

  return { actors, txExamples };
}
