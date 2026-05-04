/**
 * Daily highlight selector — picks the most significant alert from the past
 * 24 hours, marks it `is_daily=true`, optionally re-narrates with extra
 * context, posts to Telegram with a "READ OF THE DAY" header, and pins it
 * on-chain (bypassing the regular daily attestation cap, since this is a
 * single privileged event per day).
 *
 * Run via:
 *   npm run daily-digest                       # one-shot
 *   tsx src/scripts/daily-digest.ts --watch    # daemon mode (sleeps until 00:00 UTC)
 */
import crypto from "node:crypto";
import { eq, sql, desc, and, gte } from "drizzle-orm";
import { db } from "../db/index.js";
import { alerts as alertsTable } from "../db/schema.js";
import { env } from "../lib/env.js";
import { log } from "../lib/log.js";
import { sendTelegram } from "../bot/telegram.js";
import { recordAttestation } from "../narrator/attest.js";
import { veniceNarrate } from "../narrator/venice.js";
import type { Detection } from "../detector/types.js";

interface ScoredAlert {
  id: number;
  kind: string;
  severity: number;
  token: string | null;
  headline: string;
  narrative: string;
  context: unknown;
  alertHash: string;
  txUrl: string | null;
  createdAt: Date;
  score: number;
}

async function pickTopOfDay(): Promise<ScoredAlert | null> {
  const since = sql`NOW() - INTERVAL '24 hours'`;
  const rows = await db
    .select({
      id: alertsTable.id,
      kind: alertsTable.kind,
      severity: alertsTable.severity,
      token: alertsTable.token,
      headline: alertsTable.headline,
      narrative: alertsTable.narrative,
      context: alertsTable.context,
      alertHash: alertsTable.alertHash,
      txUrl: alertsTable.txUrl,
      createdAt: alertsTable.createdAt,
    })
    .from(alertsTable)
    .where(and(gte(alertsTable.createdAt, since), eq(alertsTable.isDaily, false)))
    .orderBy(desc(alertsTable.severity), desc(alertsTable.createdAt))
    .limit(50);

  if (rows.length === 0) return null;

  // Composite score: severity dominates, ties broken by USD if present.
  const scored: ScoredAlert[] = rows.map((r) => {
    const ctx = r.context as Record<string, unknown> | null;
    const usd = Number(
      (ctx as Record<string, Record<string, unknown>>)?.metrics?.usd ??
        (ctx as Record<string, Record<string, unknown>>)?.metrics?.currentUsd ??
        0,
    );
    return { ...r, score: r.severity * 1_000_000 + Math.log10(Math.max(1, usd)) };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0] ?? null;
}

function buildDailyDetection(top: ScoredAlert): Detection {
  const ctx = (top.context as Record<string, unknown> | null) ?? {};
  const rawMetrics = ((ctx as Record<string, unknown>).metrics ?? {}) as Record<string, unknown>;
  const metrics: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(rawMetrics)) {
    if (typeof v === "string" || typeof v === "number") metrics[k] = v;
  }
  return {
    kind: (top.kind as Detection["kind"]) ?? "whale_move",
    severity: top.severity,
    token: top.token ?? "MNT",
    headline: top.headline,
    windowMin: 60 * 24,
    metrics,
    actors: ((ctx as Record<string, unknown>).actors as Detection["actors"]) ?? [],
    txExamples: [],
    cooldownKey: `daily-${new Date().toISOString().slice(0, 10)}`,
  };
}

const DAILY_SYSTEM_NOTE = `Today's most significant on-chain event on Mantle. Frame this as the editor's pick — one or two sentences that lead with the move, mention the size, and end with what makes it the day's read. No emojis, no buzzwords. Ground every figure in the input.`;

async function narrateDaily(top: ScoredAlert): Promise<string> {
  const detection = buildDailyDetection(top);
  // Preface the input with the editorial framing.
  const enriched = JSON.stringify({
    framing: DAILY_SYSTEM_NOTE,
    headline: top.headline,
    narrative: top.narrative,
    metrics: detection.metrics,
    actors: detection.actors,
    severity: top.severity,
    token: top.token,
    kind: top.kind,
  });
  const result = await veniceNarrate({
    ...detection,
    metrics: { ...detection.metrics, _editorial: enriched },
  });
  return result || top.narrative;
}

function formatTelegramHeader(): string {
  const day = new Date().toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return `📖 THE READ · ${day.toUpperCase()}`;
}

export async function runDailyDigest(opts: { dryRun?: boolean } = {}): Promise<void> {
  const top = await pickTopOfDay();
  if (!top) {
    log.info("daily-digest: no alerts in the past 24h, skipping");
    return;
  }

  log.info(
    { id: top.id, severity: top.severity, headline: top.headline },
    "daily-digest: selected top alert",
  );

  let narrative = top.narrative;
  if (env.VENICE_API_KEY) {
    try {
      narrative = await narrateDaily(top);
    } catch (err) {
      log.warn({ err: String(err) }, "daily-digest: Venice failed, keeping original narrative");
    }
  }

  if (opts.dryRun) {
    log.info({ narrative }, "daily-digest: dry-run, would post");
    return;
  }

  // Mark as daily highlight in the DB
  await db.update(alertsTable).set({ isDaily: true, narrative }).where(eq(alertsTable.id, top.id));

  // Telegram post — explicit "Read of the Day" framing
  const text =
    `${formatTelegramHeader()}\n\n` +
    `${top.headline}\n\n` +
    `${narrative}\n\n` +
    `— Day's biggest move\n` +
    `↗ https://thereadmantle.vercel.app/`;

  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHANNEL_ID) {
    try {
      await sendTelegram(text);
      log.info({ id: top.id }, "daily-digest: posted to Telegram");
    } catch (err) {
      log.warn({ err: String(err) }, "daily-digest: Telegram post failed");
    }
  }

  // On-chain attestation — daily digests bypass the cap (single privileged
  // event per 24h) by re-hashing with a daily-specific prefix.
  const dailyHash =
    "0x" +
    crypto
      .createHash("sha256")
      .update(`daily:${new Date().toISOString().slice(0, 10)}:${top.alertHash}`)
      .digest("hex");
  void recordAttestation(top.id, dailyHash, 5);
}

function msUntilNextUtcMidnight(): number {
  const now = new Date();
  const nextMidnight = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0),
  );
  return nextMidnight.getTime() - now.getTime();
}

async function main(): Promise<void> {
  const watch = process.argv.includes("--watch");
  if (!watch) {
    await runDailyDigest({ dryRun: process.argv.includes("--dry-run") });
    process.exit(0);
  }

  log.info("daily-digest: watch mode (fires daily at 00:00 UTC)");
  while (true) {
    const wait = msUntilNextUtcMidnight();
    log.info({ waitHours: (wait / 3_600_000).toFixed(2) }, "daily-digest: sleeping");
    await new Promise((r) => setTimeout(r, wait));
    try {
      await runDailyDigest();
    } catch (err) {
      log.error({ err: String(err) }, "daily-digest: run failed");
    }
  }
}

if (process.argv[1]?.includes("daily-digest")) {
  main().catch((err) => {
    log.fatal({ err: String(err) }, "daily-digest crashed");
    process.exit(1);
  });
}
