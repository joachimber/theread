import { sql } from "drizzle-orm";
import { db, alerts, agentRegistry } from "./db";

export interface OnchainStats {
  totalAlerts: number;
  attestedCount: number;
  dailyAlertsCount: number;
  contractAddress: string | null;
  tokenId: string | null;
  ratio: number;
}

export async function getOnchainStats(): Promise<OnchainStats> {
  const fallback: OnchainStats = {
    totalAlerts: 0,
    attestedCount: 0,
    dailyAlertsCount: 0,
    contractAddress: process.env.AGENT_IDENTITY_ADDRESS ?? null,
    tokenId: process.env.AGENT_TOKEN_ID ?? null,
    ratio: 0,
  };
  try {
    const rows = (await db.execute<{ total: string; attested: string; daily: string }>(sql`
      SELECT
        COUNT(*)::text AS total,
        COUNT(attestation_tx)::text AS attested,
        COUNT(*) FILTER (WHERE is_daily = true)::text AS daily
      FROM ${alerts}
    `)) as unknown as Array<{ total: string; attested: string; daily: string }>;
    const r = rows[0] ?? { total: "0", attested: "0", daily: "0" };
    const [identity] = await db
      .select({ contractAddress: agentRegistry.contractAddress, tokenId: agentRegistry.tokenId })
      .from(agentRegistry)
      .limit(1);
    const total = Number(r.total);
    const attested = Number(r.attested);
    return {
      totalAlerts: total,
      attestedCount: attested,
      dailyAlertsCount: Number(r.daily),
      contractAddress: identity?.contractAddress ?? process.env.AGENT_IDENTITY_ADDRESS ?? null,
      tokenId: identity?.tokenId ?? process.env.AGENT_TOKEN_ID ?? null,
      ratio: total > 0 ? Math.round((attested / total) * 100) : 0,
    };
  } catch {
    return fallback;
  }
}
