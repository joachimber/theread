import { NextResponse } from "next/server";
import { sql, desc } from "drizzle-orm";
import { db, alerts, agentRegistry } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [identity] = await db.select().from(agentRegistry).limit(1);
    const recent = await db
      .select({
        id: alerts.id,
        headline: alerts.headline,
        alertHash: alerts.alertHash,
        attestationTx: alerts.attestationTx,
        createdAt: alerts.createdAt,
      })
      .from(alerts)
      .orderBy(desc(alerts.createdAt))
      .limit(50);
    const [counts] = (await db.execute<{ total: string; attested: string }>(sql`
      SELECT COUNT(*)::text AS total, COUNT(attestation_tx)::text AS attested FROM ${alerts}
    `)) as unknown as Array<{ total: string; attested: string }>;
    return NextResponse.json({
      identity: identity ?? null,
      attestations: recent,
      total: Number(counts?.total ?? 0),
      attested: Number(counts?.attested ?? 0),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
