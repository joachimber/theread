/**
 * Elfa AI integration — pulls 24h trending tokens from
 * https://api.elfa.ai/v2/aggregations/trending-tokens
 *
 * Endpoint shape (verified):
 *   GET /v2/aggregations/trending-tokens?timeWindow=24h&pageSize=N&minMentions=N
 *   header: x-elfa-api-key
 *   body: { success, data: { total, page, pageSize, data: [{token, current_count, previous_count, change_percent}] } }
 *
 * We fetch once per dashboard render (next.revalidate=240s) and cache in-process
 * for 4 minutes so concurrent renders share one upstream call.
 */

export interface ElfaToken {
  token: string;
  mentions: number;
  prev: number;
  changePct: number;
}

export interface ElfaSnapshot {
  /** top trending tokens globally */
  trending: ElfaToken[];
  /** subset of trending that overlaps our watched list (with our symbol mapping) */
  watched: Array<ElfaToken & { mappedTo: string }>;
  source: "elfa" | "placeholder";
  fetchedAt: number;
}

const TTL_MS = 4 * 60_000;
let cache: ElfaSnapshot | null = null;
let inflight: Promise<ElfaSnapshot> | null = null;

/** Watched-token aliases — Elfa indexes by spoken ticker, not contract. */
const WATCH_ALIAS: Record<string, string[]> = {
  MNT: ["mnt", "mantle", "$mnt"],
  mETH: ["meth", "mantleeth", "$meth"],
  USDe: ["usde", "ethena", "$usde"],
  USDY: ["usdy", "ondo"],
  FBTC: ["fbtc", "ignition", "ignition-fbtc"],
  WETH: ["eth", "ethereum"],
  WBTC: ["btc", "bitcoin", "wbtc"],
  USDC: ["usdc"],
  USDT: ["usdt", "tether"],
};

const WATCHED_SYMBOLS = Object.keys(WATCH_ALIAS);

function placeholder(): ElfaSnapshot {
  return {
    trending: [],
    watched: WATCHED_SYMBOLS.map((s) => ({
      token: s.toLowerCase(),
      mentions: 0,
      prev: 0,
      changePct: 0,
      mappedTo: s,
    })),
    source: "placeholder",
    fetchedAt: Date.now(),
  };
}

export async function getElfaMindshare(): Promise<ElfaSnapshot> {
  if (cache && Date.now() - cache.fetchedAt < TTL_MS) return cache;
  if (inflight) return inflight;

  if (!process.env.ELFA_API_KEY) {
    cache = placeholder();
    return cache;
  }

  inflight = (async () => {
    try {
      const url = "https://api.elfa.ai/v2/aggregations/trending-tokens?timeWindow=24h&pageSize=50&minMentions=3";
      const res = await fetch(url, {
        headers: { "x-elfa-api-key": process.env.ELFA_API_KEY! },
        next: { revalidate: 240, tags: ["elfa"] },
      });
      if (!res.ok) throw new Error(`elfa ${res.status}`);
      const body = (await res.json()) as {
        success?: boolean;
        data?: {
          data?: Array<{
            token?: string;
            current_count?: number;
            previous_count?: number;
            change_percent?: number;
          }>;
        };
      };
      const list = body.data?.data ?? [];
      const trending: ElfaToken[] = list.map((r) => ({
        token: (r.token ?? "").toLowerCase(),
        mentions: r.current_count ?? 0,
        prev: r.previous_count ?? 0,
        changePct: r.change_percent ?? 0,
      }));

      const watched: ElfaSnapshot["watched"] = WATCHED_SYMBOLS.map((s) => {
        const aliases = WATCH_ALIAS[s] ?? [s.toLowerCase()];
        const hit = trending.find((t) => aliases.includes(t.token));
        return hit
          ? { ...hit, mappedTo: s }
          : { token: s.toLowerCase(), mentions: 0, prev: 0, changePct: 0, mappedTo: s };
      });

      cache = { trending: trending.slice(0, 12), watched, source: "elfa", fetchedAt: Date.now() };
      return cache;
    } catch {
      cache = placeholder();
      return cache;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
