import { NextResponse } from "next/server";
import { getTopWallets } from "../../../lib/queries";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(500, Number(url.searchParams.get("limit") ?? 100));
  try {
    const rows = await getTopWallets(limit);
    return NextResponse.json({ wallets: rows });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
