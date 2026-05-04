/**
 * Seed a small set of synthetic alerts so the dashboard / bot have something
 * to render before the indexer has caught up. Useful for live demos before
 * the database is warm. Run with: npm run seed
 */
import crypto from "node:crypto";
import { db } from "../db/index.js";
import { alerts as alertsTable } from "../db/schema.js";
import { log } from "../lib/log.js";

const seeds = [
  {
    kind: "price_spike",
    severity: 4,
    token: "MNT",
    headline: "MNT up +5.2% in 15m",
    narrative:
      "MNT is up 5.2% in the last 15 minutes on roughly $6M of buying — Bybit's hot wallet led with $4M and a single whale added $2.1M.",
    context: { kind: "price_spike", token: "MNT", metrics: { pct: 5.2, windowMin: 15 } },
    txUrl: null,
  },
  {
    kind: "whale_move",
    severity: 4,
    token: "USDe",
    headline: "$8.3M USDe withdrawal",
    narrative:
      "$8.3M USDe just left a Bybit hot wallet for a fresh address with no prior on-chain history.",
    context: { kind: "whale_move", token: "USDe", metrics: { usd: 8_300_000 } },
    txUrl: "https://mantlescan.xyz/tx/0xseed1",
  },
  {
    kind: "volume_spike",
    severity: 3,
    token: "mETH",
    headline: "mETH volume 4x normal",
    narrative:
      "mETH volume hit $14M in the last hour, about 4x the 24h average. Most of it was a single unlabeled wallet ($5.5M) plus an arb bot rotating in.",
    context: { kind: "volume_spike", token: "mETH", metrics: { currentUsd: 14_200_000, sigma: 4.1 } },
    txUrl: null,
  },
];

async function main(): Promise<void> {
  for (const s of seeds) {
    const hash =
      "0x" +
      crypto
        .createHash("sha256")
        .update(JSON.stringify(s.context) + Date.now())
        .digest("hex");
    await db
      .insert(alertsTable)
      .values({ ...s, alertHash: hash })
      .onConflictDoNothing();
  }
  log.info({ count: seeds.length }, "seeded demo alerts");
  process.exit(0);
}

main().catch((err) => {
  log.fatal({ err: String(err) }, "seed crashed");
  process.exit(1);
});
