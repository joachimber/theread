/**
 * Hourly market digest — every hour on the hour, pulls the past 60 minutes
 * of chain activity (top transfers, token volume, price moves) and posts a
 * 2-3 sentence "what just happened on Mantle" to the Telegram channel.
 *
 * Always fires once per hour, regardless of whether any anomaly crossed a
 * threshold. This gives the feed predictable rhythm — ~24 messages/day —
 * with variety, instead of feast-or-famine event alerts.
 *
 * Doesn't attest on-chain (too many pins). Daily digest still picks the
 * day's most significant event from the past 24h and pins that.
 *
 * Run via:
 *   npm run hourly-digest                    # one-shot
 *   tsx src/scripts/hourly-digest.ts --watch # daemon
 */
import { sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { transfers } from "../db/schema.js";
import { TOKENS_BY_ADDRESS } from "../lib/tokens.js";
import { fmtUsd, fmtPct } from "../lib/format.js";
import { env } from "../lib/env.js";
import { log } from "../lib/log.js";
import { sendTelegram } from "../bot/telegram.js";
import { veniceNarrate } from "../narrator/venice.js";
import type { Detection } from "../detector/types.js";

interface HourSnapshot {
  blockNumber: number;
  totalUsd: number;
  transferCount: number;
  walletCount: number;
  topToken: { symbol: string; usd: number; tx: number } | null;
  topTransfer: { token: string; usd: number; from: string; to: string; tx: string } | null;
  topMover: { addr: string; netUsd: number; topToken: string } | null;
}

async function pullHour(): Promise<HourSnapshot> {
  const [agg] = (await db.execute<{
    total: string;
    n: string;
    wallets: string;
    block: string;
  }>(sql`
    WITH t AS (
      SELECT * FROM ${transfers} WHERE ts >= NOW() - INTERVAL '60 minutes'
    )
    SELECT
      COALESCE(SUM(usd_value),0)::text AS total,
      COUNT(*)::text AS n,
      COUNT(DISTINCT addr)::text AS wallets,
      COALESCE(MAX(block_number),0)::text AS block
    FROM t,
      LATERAL (VALUES (t.from_addr), (t.to_addr)) AS x(addr)
  `)) as unknown as Array<{ total: string; n: string; wallets: string; block: string }>;

  const tokens = (await db.execute<{ token: string; usd: string; tx: string }>(sql`
    SELECT token, COALESCE(SUM(usd_value),0)::text AS usd, COUNT(*)::text AS tx
    FROM ${transfers}
    WHERE ts >= NOW() - INTERVAL '60 minutes'
    GROUP BY token
    ORDER BY COALESCE(SUM(usd_value),0) DESC
    LIMIT 1
  `)) as unknown as Array<{ token: string; usd: string; tx: string }>;
  const topTokenRaw = tokens[0];

  const topTransfers = (await db.execute<{
    token: string;
    usd: string;
    from_addr: string;
    to_addr: string;
    tx_hash: string;
  }>(sql`
    SELECT token, usd_value::text AS usd, from_addr, to_addr, tx_hash
    FROM ${transfers}
    WHERE ts >= NOW() - INTERVAL '60 minutes' AND usd_value IS NOT NULL
    ORDER BY usd_value DESC
    LIMIT 1
  `)) as unknown as Array<{ token: string; usd: string; from_addr: string; to_addr: string; tx_hash: string }>;
  const topT = topTransfers[0];

  const movers = (await db.execute<{ addr: string; net: string; top_token: string }>(sql`
    SELECT addr, (inflow - outflow)::text AS net, top_token
    FROM (
      SELECT
        x.addr,
        COALESCE(SUM(CASE WHEN t.to_addr = x.addr THEN t.usd_value END), 0) AS inflow,
        COALESCE(SUM(CASE WHEN t.from_addr = x.addr THEN t.usd_value END), 0) AS outflow,
        (
          SELECT t2.token
          FROM ${transfers} t2
          WHERE (t2.from_addr = x.addr OR t2.to_addr = x.addr)
            AND t2.ts >= NOW() - INTERVAL '60 minutes'
          GROUP BY t2.token
          ORDER BY COUNT(*) DESC
          LIMIT 1
        ) AS top_token
      FROM ${transfers} t,
        LATERAL (VALUES (t.from_addr), (t.to_addr)) AS x(addr)
      WHERE t.ts >= NOW() - INTERVAL '60 minutes'
      GROUP BY x.addr
    ) inner_q
    ORDER BY ABS(inflow - outflow) DESC
    LIMIT 1
  `)) as unknown as Array<{ addr: string; net: string; top_token: string }>;
  const topMover = movers[0];

  return {
    blockNumber: Number(agg?.block ?? 0),
    totalUsd: Number(agg?.total ?? 0),
    transferCount: Number(agg?.n ?? 0),
    walletCount: Number(agg?.wallets ?? 0),
    topToken: topTokenRaw
      ? {
          symbol: TOKENS_BY_ADDRESS.get(topTokenRaw.token)?.symbol ?? topTokenRaw.token.slice(0, 6),
          usd: Number(topTokenRaw.usd),
          tx: Number(topTokenRaw.tx),
        }
      : null,
    topTransfer: topT
      ? {
          token: TOKENS_BY_ADDRESS.get(topT.token)?.symbol ?? topT.token.slice(0, 6),
          usd: Number(topT.usd),
          from: topT.from_addr,
          to: topT.to_addr,
          tx: topT.tx_hash,
        }
      : null,
    topMover: topMover
      ? {
          addr: topMover.addr,
          netUsd: Number(topMover.net),
          topToken:
            TOKENS_BY_ADDRESS.get(topMover.top_token)?.symbol ?? topMover.top_token?.slice(0, 6) ?? "—",
        }
      : null,
  };
}

const HOURLY_PROMPT_NOTE = `This is the hourly Mantle market wrap. Past 60 minutes of activity. Lead with the headline number (USD volume or biggest move). Mention the top token and one notable wallet move if interesting. 2 sentences max. Plain English. No buzzwords.`;

async function narrateHour(snap: HourSnapshot): Promise<string | null> {
  if (snap.transferCount === 0) return null;
  // Repurpose the narrator with a "summary" Detection-shape input.
  const detection: Detection = {
    kind: "volume_spike",
    severity: 3,
    token: snap.topToken?.symbol ?? "MNT",
    headline: `Past hour · ${fmtUsd(snap.totalUsd)} flow`,
    windowMin: 60,
    metrics: {
      _framing: HOURLY_PROMPT_NOTE,
      totalUsd: snap.totalUsd,
      transferCount: snap.transferCount,
      walletCount: snap.walletCount,
      topTokenUsd: snap.topToken?.usd ?? 0,
      topTransferUsd: snap.topTransfer?.usd ?? 0,
    },
    actors: snap.topMover
      ? [
          {
            address: snap.topMover.addr,
            labels: [],
            usdValue: Math.abs(snap.topMover.netUsd),
            action: snap.topMover.netUsd > 0 ? "buy" : "sell",
            token: snap.topMover.topToken,
          },
        ]
      : [],
    txExamples: snap.topTransfer ? [snap.topTransfer.tx] : [],
    cooldownKey: `hourly-${new Date().toISOString().slice(0, 13)}`,
  };
  return await veniceNarrate(detection);
}

function format(snap: HourSnapshot, narrative: string | null): string {
  const hour = new Date().toLocaleString("en-US", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const date = new Date().toLocaleString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  });
  const header = `📊 PAST HOUR · ${date} ${hour} UTC`;

  if (snap.transferCount === 0) {
    return `${header}\n\nMantle was quiet — no significant transfers in the past 60 minutes.`;
  }

  const stats = [
    `${fmtUsd(snap.totalUsd)} USD across ${snap.transferCount} transfers`,
    `${snap.walletCount} active wallets`,
    snap.topToken ? `${snap.topToken.symbol} led volume at ${fmtUsd(snap.topToken.usd)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const body = narrative ? `${narrative}\n\n${stats}` : stats;
  const link = snap.topTransfer
    ? `\nhttps://mantlescan.xyz/tx/${snap.topTransfer.tx}`
    : "";
  return `${header}\n\n${body}${link}`;
}

export async function runHourlyDigest(opts: { dryRun?: boolean } = {}): Promise<void> {
  const snap = await pullHour();
  log.info(
    {
      transferCount: snap.transferCount,
      totalUsd: snap.totalUsd,
      topToken: snap.topToken?.symbol,
    },
    "hourly-digest snapshot",
  );

  const narrative = await narrateHour(snap).catch(() => null);
  const text = format(snap, narrative);

  if (opts.dryRun) {
    console.log(text);
    return;
  }

  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHANNEL_ID) {
    try {
      await sendTelegram(text);
      log.info("hourly-digest posted");
    } catch (err) {
      log.warn({ err: String(err) }, "hourly-digest Telegram post failed");
    }
  }
}

function msUntilNextUtcHour(): number {
  const now = new Date();
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours() + 1, 0, 0),
  );
  return next.getTime() - now.getTime();
}

async function main(): Promise<void> {
  const watch = process.argv.includes("--watch");
  if (!watch) {
    await runHourlyDigest({ dryRun: process.argv.includes("--dry-run") });
    process.exit(0);
  }
  log.info("hourly-digest: watch mode (fires every UTC hour)");
  while (true) {
    const wait = msUntilNextUtcHour();
    log.info({ waitMin: (wait / 60_000).toFixed(2) }, "hourly-digest: sleeping");
    await new Promise((r) => setTimeout(r, wait));
    try {
      await runHourlyDigest();
    } catch (err) {
      log.error({ err: String(err) }, "hourly-digest run failed");
    }
  }
}

if (process.argv[1]?.includes("hourly-digest")) {
  main().catch((err) => {
    log.fatal({ err: String(err) }, "hourly-digest crashed");
    process.exit(1);
  });
}
