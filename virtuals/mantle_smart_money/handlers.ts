/**
 * ACP handler for `mantle_smart_money`. Returns top movers on Mantle for
 * the live window. Calls our public dashboard's `/api/wallets` so the
 * seller runtime doesn't need to re-implement the indexer.
 */

interface JobPayload {
  limit?: number;
  minUsd?: number;
}

const DASHBOARD_BASE = process.env.READ_DASHBOARD_BASE ?? "https://theread.xyz";

export async function executeJob(payload: JobPayload): Promise<{ wallets: unknown; source: string }> {
  const limit = Math.max(1, Math.min(50, payload.limit ?? 10));
  const minUsd = Math.max(0, payload.minUsd ?? 1_000);

  const url = `${DASHBOARD_BASE}/api/wallets?limit=${limit}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`dashboard ${res.status}`);

  const body = (await res.json()) as {
    wallets?: Array<{
      address: string;
      volumeUsd: number;
      txCount: number;
      labels: string[];
      lastSeen: string;
    }>;
  };
  const wallets = (body.wallets ?? []).filter((w) => w.volumeUsd >= minUsd);

  return { wallets, source: `${DASHBOARD_BASE}/wallets` };
}

export function validate(payload: JobPayload): { ok: true } | { ok: false; reason: string } {
  if (payload.limit !== undefined && (payload.limit < 1 || payload.limit > 50)) {
    return { ok: false, reason: "limit out of range (1-50)" };
  }
  return { ok: true };
}
