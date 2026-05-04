import { sql, desc, eq } from "drizzle-orm";
import { db, alerts, wallets, walletLabels, transfers, indexerCursor, blocks } from "./db";
import { isDemoMode, demoStats, demoAlerts, demoWallets, demoTokenVolumes } from "./demo-data";

export interface DashboardStats {
  alertsToday: number;
  alertsAttested: number;
  walletsTracked: number;
  transfers24hUsd: number;
  topToken: { symbol: string | null; volumeUsd: number } | null;
  indexerLag: number;
  lastBlockTs: Date | null;
}

async function withDemoFallback<T>(real: () => Promise<T>, demo: T): Promise<T> {
  if (isDemoMode) return demo;
  try {
    return await real();
  } catch {
    if (!process.env.DATABASE_URL) return demo;
    throw new Error("DATABASE_URL set but query failed");
  }
}

export async function getStats(): Promise<DashboardStats> {
  return withDemoFallback(async () => {
    const [todayRow] = (await db.execute<{ c: string }>(sql`
      SELECT COUNT(*)::text AS c FROM ${alerts} WHERE created_at >= NOW() - INTERVAL '24 hours'
    `)) as unknown as Array<{ c: string }>;
    const [attestedRow] = (await db.execute<{ c: string }>(sql`
      SELECT COUNT(*)::text AS c FROM ${alerts} WHERE attestation_tx IS NOT NULL
    `)) as unknown as Array<{ c: string }>;
    const [walletRow] = (await db.execute<{ c: string }>(sql`
      SELECT COUNT(*)::text AS c FROM ${wallets}
    `)) as unknown as Array<{ c: string }>;
    const [volRow] = (await db.execute<{ v: string }>(sql`
      SELECT COALESCE(SUM(usd_value),0)::text AS v
      FROM ${transfers}
      WHERE ts >= NOW() - INTERVAL '24 hours'
    `)) as unknown as Array<{ v: string }>;
    const [topRow] = (await db.execute<{ token: string | null; vol: string }>(sql`
      SELECT token, COALESCE(SUM(usd_value),0)::text AS vol
      FROM ${transfers}
      WHERE ts >= NOW() - INTERVAL '24 hours'
      GROUP BY token
      ORDER BY COALESCE(SUM(usd_value),0) DESC
      LIMIT 1
    `)) as unknown as Array<{ token: string | null; vol: string }>;

    const cursor = await db
      .select({ blockNumber: indexerCursor.blockNumber, updatedAt: indexerCursor.updatedAt })
      .from(indexerCursor)
      .where(eq(indexerCursor.name, "transfers"))
      .limit(1);

    const lastBlock = cursor[0]?.blockNumber ?? 0;
    const lastBlockRow = lastBlock
      ? await db.select().from(blocks).where(eq(blocks.number, lastBlock)).limit(1)
      : [];

    return {
      alertsToday: Number(todayRow?.c ?? 0),
      alertsAttested: Number(attestedRow?.c ?? 0),
      walletsTracked: Number(walletRow?.c ?? 0),
      transfers24hUsd: Number(volRow?.v ?? 0),
      topToken: topRow ? { symbol: topRow.token, volumeUsd: Number(topRow.vol) } : null,
      indexerLag: Math.max(0, Date.now() - (cursor[0]?.updatedAt?.getTime() ?? 0)) / 1000,
      lastBlockTs: lastBlockRow[0]?.timestamp ?? null,
    };
  }, demoStats);
}

export interface AlertRow {
  id: number;
  kind: string;
  severity: number;
  token: string | null;
  headline: string;
  narrative: string;
  txUrl: string | null;
  attestationTx: string | null;
  alertHash: string;
  createdAt: Date;
}

export async function getRecentAlerts(limit = 50): Promise<AlertRow[]> {
  return withDemoFallback<AlertRow[]>(
    async () => {
      const rows = await db
        .select({
          id: alerts.id,
          kind: alerts.kind,
          severity: alerts.severity,
          token: alerts.token,
          headline: alerts.headline,
          narrative: alerts.narrative,
          txUrl: alerts.txUrl,
          attestationTx: alerts.attestationTx,
          alertHash: alerts.alertHash,
          createdAt: alerts.createdAt,
        })
        .from(alerts)
        .orderBy(desc(alerts.createdAt))
        .limit(limit);
      return rows;
    },
    demoAlerts.slice(0, limit) as AlertRow[],
  );
}

export async function getTopWallets(limit = 50) {
  return withDemoFallback(async () => {
    const rows = await db.execute<{
      address: string;
      volume: string;
      txs: string;
      last_seen: Date;
      labels: string | null;
    }>(sql`
      SELECT
        w.address,
        w.total_volume_usd::text AS volume,
        w.tx_count::text AS txs,
        w.last_seen,
        string_agg(l.label, ', ' ORDER BY l.confidence DESC) AS labels
      FROM ${wallets} w
      LEFT JOIN ${walletLabels} l ON l.address = w.address
      GROUP BY w.address, w.total_volume_usd, w.tx_count, w.last_seen
      ORDER BY w.total_volume_usd DESC NULLS LAST
      LIMIT ${limit}
    `);
    return (rows as unknown as Array<{
      address: string;
      volume: string;
      txs: string;
      last_seen: Date;
      labels: string | null;
    }>).map((r) => ({
      address: r.address,
      volumeUsd: Number(r.volume),
      txCount: Number(r.txs),
      lastSeen: r.last_seen,
      labels: r.labels ? r.labels.split(", ") : [],
    }));
  }, demoWallets.slice(0, limit));
}

export async function getAgentSnapshot() {
  return withDemoFallback(
    async () => {
      const { agentRegistry } = await import("../../src/db/schema");
      const [identity] = await db.select().from(agentRegistry).limit(1);
      const recent = await db
        .select({
          id: alerts.id,
          headline: alerts.headline,
          attestationTx: alerts.attestationTx,
          alertHash: alerts.alertHash,
          createdAt: alerts.createdAt,
        })
        .from(alerts)
        .orderBy(desc(alerts.createdAt))
        .limit(40);
      const [counts] = (await db.execute<{ totalCount: string; attestedCount: string }>(sql`
        SELECT COUNT(*)::text AS "totalCount", COUNT(attestation_tx)::text AS "attestedCount"
        FROM ${alerts}
      `)) as unknown as Array<{ totalCount: string; attestedCount: string }>;
      return {
        identity: identity ?? null,
        recent,
        total: Number(counts?.totalCount ?? 0),
        attested: Number(counts?.attestedCount ?? 0),
      };
    },
    {
      identity: {
        id: 1,
        contractAddress: "0x4f7Ed5a05Cb02d92F75c1A8a6dB0E6f3D1E7c2BA",
        tokenId: "1",
        name: "The Read",
        metadataUri: "https://theread.xyz/agent.json",
        mintTx: "0xa3f7c9d1e5f80123abc",
        createdAt: new Date(),
      },
      recent: demoAlerts.map((a) => ({
        id: a.id,
        headline: a.headline,
        attestationTx: a.attestationTx,
        alertHash: a.alertHash,
        createdAt: a.createdAt,
      })),
      total: demoAlerts.length,
      attested: demoAlerts.filter((a) => a.attestationTx).length,
    },
  );
}

export async function getTokenVolumes24h() {
  return withDemoFallback(async () => {
    const rows = await db.execute<{ token: string; volume: string; transfers: string }>(sql`
      SELECT token, COALESCE(SUM(usd_value),0)::text AS volume, COUNT(*)::text AS transfers
      FROM ${transfers}
      WHERE ts >= NOW() - INTERVAL '24 hours'
      GROUP BY token
      ORDER BY COALESCE(SUM(usd_value),0) DESC
      LIMIT 10
    `);
    return (rows as unknown as Array<{ token: string; volume: string; transfers: string }>).map((r) => ({
      token: r.token,
      volumeUsd: Number(r.volume),
      transfers: Number(r.transfers),
    }));
  }, demoTokenVolumes);
}
