import { NextResponse } from "next/server";
import { getStats, getTokenVolumes24h } from "../../../lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [stats, tokens] = await Promise.all([getStats(), getTokenVolumes24h()]);
    return NextResponse.json({ stats, tokens });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
