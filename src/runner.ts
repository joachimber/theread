/**
 * Single-process orchestrator: indexer + price worker + detector loop +
 * Telegram bot. Convenient for `npm run dev` and small deployments. For
 * scale, run each as its own process with the dedicated entrypoints.
 */
import { runIndexer } from "./indexer/runner.js";
import { runDetectorLoop } from "./detector/runner.js";
import { startTelegramBot } from "./bot/telegram.js";
import { runHeuristicLabelers } from "./indexer/labels.js";
import { runDailyDigest } from "./scripts/daily-digest.js";
import { log } from "./lib/log.js";

async function main(): Promise<void> {
  log.info("the read — booting");

  // Periodic labeler — every 30 minutes after the first run.
  await runHeuristicLabelers().catch((err) =>
    log.warn({ err: String(err) }, "initial labeler run failed (table may be empty)"),
  );
  setInterval(() => {
    runHeuristicLabelers().catch((err) => log.warn({ err: String(err) }, "labeler run failed"));
  }, 30 * 60_000);

  // Daily digest — fires at 00:00 UTC, picks the day's biggest read,
  // posts to Telegram with editorial framing, attests on-chain.
  scheduleDailyDigest();

  await Promise.all([
    runIndexer().catch((err) => log.fatal({ err: String(err) }, "indexer crashed")),
    runDetectorLoop().catch((err) => log.fatal({ err: String(err) }, "detector crashed")),
    startTelegramBot().catch((err) => log.warn({ err: String(err) }, "bot launch failed")),
  ]);
}

function msUntilNextUtcMidnight(): number {
  const now = new Date();
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0),
  );
  return next.getTime() - now.getTime();
}

function scheduleDailyDigest(): void {
  const tick = async () => {
    try {
      await runDailyDigest();
    } catch (err) {
      log.error({ err: String(err) }, "daily-digest tick failed");
    }
    setTimeout(tick, msUntilNextUtcMidnight());
  };
  setTimeout(tick, msUntilNextUtcMidnight());
  log.info(
    { hoursUntilFirstTick: (msUntilNextUtcMidnight() / 3_600_000).toFixed(2) },
    "daily digest scheduled",
  );
}

main().catch((err) => {
  log.fatal({ err: String(err) }, "runner crashed");
  process.exit(1);
});
