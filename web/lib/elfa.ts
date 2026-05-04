/**
 * Elfa AI integration — pulls 24h trending tokens from
 * https://api.elfa.ai/v2/aggregations/trending-tokens
 *
 * Free tier ceiling: 30 calls/day. We're targeting **1-2 calls/day max**.
 *
 * Three-layer caching strategy:
 *   1. In-process memory cache  — 12h TTL
 *   2. Next.js fetch revalidate — 12h (43_200s)
 *   3. On-disk persisted snapshot at .next/cache/elfa.json so the cache
 *      survives server restarts during dev. (No-op in serverless prod.)
 *
 * Failure mode: if Elfa returns 4xx/5xx, we keep serving the last good
 * snapshot indefinitely (just retry the next time the in-process TTL
 * expires). Hammering a paid endpoint when credits run out is the
 * worst possible outcome — that's the bug we're avoiding.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

export interface ElfaToken {
  token: string;
  mentions: number;
  prev: number;
  changePct: number;
}

export interface ElfaSnapshot {
  /** top trending tokens globally */
  trending: ElfaToken[];
  /** subset of trending that overlaps our watched list */
  watched: Array<ElfaToken & { mappedTo: string }>;
  source: "elfa" | "elfa-stale" | "placeholder";
  fetchedAt: number;
  /** last upstream attempt; updated even on failure to control retry pace */
  attemptedAt: number;
  /** last error message if the most recent attempt failed */
  lastError?: string;
}

const TTL_MS = 12 * 60 * 60_000; // 12 hours
const ERROR_BACKOFF_MS = 60 * 60_000; // after a failure, wait 1h before retrying
const DISK_PATH = path.join(process.cwd(), ".next", "cache", "elfa.json");

let memCache: ElfaSnapshot | null = null;
let inflight: Promise<ElfaSnapshot> | null = null;
let diskLoaded = false;

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

function placeholder(reason: string): ElfaSnapshot {
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
    attemptedAt: Date.now(),
    lastError: reason,
  };
}

async function loadDisk(): Promise<void> {
  if (diskLoaded) return;
  diskLoaded = true;
  try {
    const raw = await fs.readFile(DISK_PATH, "utf8");
    const parsed = JSON.parse(raw) as ElfaSnapshot;
    if (parsed?.trending && parsed?.watched) memCache = parsed;
  } catch {
    // first run — no disk cache yet
  }
}

async function saveDisk(snap: ElfaSnapshot): Promise<void> {
  try {
    await fs.mkdir(path.dirname(DISK_PATH), { recursive: true });
    await fs.writeFile(DISK_PATH, JSON.stringify(snap), "utf8");
  } catch {
    // serverless / read-only fs — tolerate
  }
}

function isFresh(snap: ElfaSnapshot | null): boolean {
  return !!snap && snap.source === "elfa" && Date.now() - snap.fetchedAt < TTL_MS;
}

function shouldRetry(snap: ElfaSnapshot | null): boolean {
  if (!snap) return true;
  if (snap.source === "elfa" && Date.now() - snap.fetchedAt < TTL_MS) return false;
  // failed last time — back off
  if (snap.source !== "elfa" && Date.now() - snap.attemptedAt < ERROR_BACKOFF_MS) return false;
  return true;
}

export async function getElfaMindshare(): Promise<ElfaSnapshot> {
  await loadDisk();

  if (isFresh(memCache)) return memCache!;

  if (inflight) return inflight;
  if (!process.env.ELFA_API_KEY) {
    return memCache && memCache.source === "elfa"
      ? { ...memCache, source: "elfa-stale" }
      : placeholder("ELFA_API_KEY not set");
  }
  if (!shouldRetry(memCache)) {
    return memCache && memCache.source === "elfa"
      ? { ...memCache, source: "elfa-stale" }
      : memCache!;
  }

  inflight = (async () => {
    try {
      const url = "https://api.elfa.ai/v2/aggregations/trending-tokens?timeWindow=24h&pageSize=50&minMentions=3";
      const res = await fetch(url, {
        headers: { "x-elfa-api-key": process.env.ELFA_API_KEY! },
        next: { revalidate: 43_200, tags: ["elfa"] },
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

      const next: ElfaSnapshot = {
        trending: trending.slice(0, 12),
        watched,
        source: "elfa",
        fetchedAt: Date.now(),
        attemptedAt: Date.now(),
      };
      memCache = next;
      void saveDisk(next);
      return next;
    } catch (err) {
      // mark attempt, but keep last good snapshot if we have one
      if (memCache && memCache.source === "elfa") {
        memCache = {
          ...memCache,
          source: "elfa-stale",
          attemptedAt: Date.now(),
          lastError: String(err),
        };
        return memCache;
      }
      memCache = placeholder(String(err));
      return memCache;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
