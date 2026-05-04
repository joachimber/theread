import crypto from "node:crypto";
import { db } from "../db/index.js";
import { alerts as alertsTable } from "../db/schema.js";
import { log } from "../lib/log.js";
import { env } from "../lib/env.js";
import { detectPriceSpikes, detectVolumeSpikes, detectWhaleMoves } from "./detectors.js";
import { isOnCooldown, setCooldown, pruneExpired } from "./cooldown.js";
import { narrate } from "../narrator/index.js";
import { dispatchAlert } from "../bot/dispatch.js";
import { recordAttestation } from "../narrator/attest.js";
import type { Detection } from "./types.js";

function hashContext(d: Detection): string {
  const canonical = JSON.stringify({
    kind: d.kind,
    token: d.token,
    metrics: d.metrics,
    txExamples: d.txExamples,
  });
  return "0x" + crypto.createHash("sha256").update(canonical).digest("hex");
}

async function runDetectors(): Promise<Detection[]> {
  const [priceSpikes, volumeSpikes, whales] = await Promise.all([
    detectPriceSpikes().catch((err) => {
      log.warn({ err: String(err) }, "price-spike detector failed");
      return [] as Detection[];
    }),
    detectVolumeSpikes().catch((err) => {
      log.warn({ err: String(err) }, "volume-spike detector failed");
      return [] as Detection[];
    }),
    detectWhaleMoves().catch((err) => {
      log.warn({ err: String(err) }, "whale detector failed");
      return [] as Detection[];
    }),
  ]);
  return [...priceSpikes, ...volumeSpikes, ...whales].sort((a, b) => b.severity - a.severity);
}

async function handleDetection(d: Detection): Promise<void> {
  if (await isOnCooldown(d.cooldownKey)) return;
  await setCooldown(d.cooldownKey, env.ALERT_COOLDOWN_MIN);

  const narrative = await narrate(d).catch((err) => {
    log.warn({ err: String(err) }, "narrator failed; falling back to headline");
    return d.headline;
  });

  const alertHash = hashContext(d);
  const txUrl = d.txExamples[0]
    ? `https://mantlescan.xyz/tx/${d.txExamples[0]}`
    : null;

  let alertId: number;
  try {
    const inserted = await db
      .insert(alertsTable)
      .values({
        kind: d.kind,
        severity: d.severity,
        token: d.token ?? null,
        headline: d.headline,
        narrative,
        context: d as unknown as Record<string, unknown>,
        alertHash,
        txUrl,
      })
      .returning({ id: alertsTable.id });
    alertId = inserted[0]!.id;
  } catch (err) {
    log.warn({ err: String(err) }, "alert insert failed (likely dedupe)");
    return;
  }

  log.info(
    { id: alertId, kind: d.kind, sev: d.severity, token: d.token, headline: d.headline },
    "alert",
  );

  await dispatchAlert({ id: alertId, headline: d.headline, narrative, severity: d.severity, txUrl, kind: d.kind, token: d.token });
  void recordAttestation(alertId, alertHash);
}

export async function runDetectorLoop(intervalMs = 30_000): Promise<void> {
  log.info({ intervalMs }, "detector loop starting");
  let stopping = false;
  process.on("SIGINT", () => { stopping = true; });
  process.on("SIGTERM", () => { stopping = true; });

  while (!stopping) {
    try {
      const detections = await runDetectors();
      for (const d of detections) {
        await handleDetection(d);
      }
      if (Math.random() < 0.05) await pruneExpired();
    } catch (err) {
      log.error({ err: String(err) }, "detector loop error");
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  log.info("detector loop stopped");
}
