import { NextResponse } from "next/server";
import { getRecentAlerts } from "../../../lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(200, Number(url.searchParams.get("limit") ?? 50));
  try {
    const rows = await getRecentAlerts(limit);
    return NextResponse.json({ alerts: rows });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
