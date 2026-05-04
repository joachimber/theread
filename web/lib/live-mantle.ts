/**
 * Real-time Mantle data pulled directly via RPC + Coingecko, with no
 * indexer or database in the loop. This is the "no setup required"
 * demo path — every dashboard render reflects the actual chain state.
 *
 * In production, the indexer feeds a Postgres warehouse and this file
 * is unused; here it lets the dashboard render against live data while
 * the user is still wiring their .env.
 */
import { createPublicClient, http, fallback, parseAbiItem, decodeEventLog, type Log } from "viem";
import { defineChain } from "viem";
import {
  TOKENS,
  TOKENS_BY_ADDRESS,
  WATCHED_ADDRESSES,
  COINGECKO_IDS,
  COINGECKO_TO_SYMBOL,
} from "../../src/lib/tokens";
import { erc20Abi } from "../../src/lib/abi";

const mantle = defineChain({
  id: 5000,
  name: "Mantle",
  nativeCurrency: { name: "Mantle", symbol: "MNT", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.MANTLE_RPC_URL ?? "https://rpc.mantle.xyz",
        "https://mantle-mainnet.public.blastapi.io",
        "https://mantle-rpc.publicnode.com",
      ],
    },
  },
});

const client = createPublicClient({
  chain: mantle,
  transport: fallback(
    [
      http(process.env.MANTLE_RPC_URL ?? "https://rpc.mantle.xyz"),
      http("https://mantle-mainnet.public.blastapi.io"),
      http("https://mantle-rpc.publicnode.com"),
    ],
    { rank: false },
  ),
  batch: { multicall: true },
});

const TRANSFER_EVENT = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

/* ------------------ price cache ------------------ */

interface PriceEntry {
  usd: number;
  change24h: number | null;
  ts: number;
}
const priceCache = new Map<string, PriceEntry>();
const PRICE_TTL_MS = 60_000;

async function fetchPrices(): Promise<void> {
  const fresh = [...priceCache.values()].every((v) => Date.now() - v.ts < PRICE_TTL_MS);
  if (fresh && priceCache.size > 0) return;
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${COINGECKO_IDS.join(
    ",",
  )}&vs_currencies=usd&include_24hr_change=true`;
  try {
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      next: { revalidate: 120, tags: ["coingecko"] },
    });
    if (!res.ok) return;
    const body = (await res.json()) as Record<
      string,
      { usd?: number; usd_24h_change?: number }
    >;
    const ts = Date.now();
    for (const [id, v] of Object.entries(body)) {
      if (typeof v.usd !== "number") continue;
      const symbol = COINGECKO_TO_SYMBOL[id];
      if (!symbol) continue;
      priceCache.set(symbol.toUpperCase(), {
        usd: v.usd,
        change24h: typeof v.usd_24h_change === "number" ? v.usd_24h_change : null,
        ts,
      });
    }
  } catch {
    // soft-fail; previous cache values remain
  }
}

export function getCachedPrice(symbol: string): PriceEntry | null {
  return priceCache.get(symbol.toUpperCase()) ?? null;
}

/* ------------------ block + log cache ------------------ */

interface LiveSnapshot {
  ts: number;
  blockNumber: number;
  blockTs: Date;
  windowSec: number;
  transfers: ParsedTransfer[];
  topByToken: TokenSummary[];
  topMovers: WalletMover[];
  alerts: LiveAlert[];
  prices: Record<string, PriceEntry>;
  walletCount: number;
}

export interface ParsedTransfer {
  blockNumber: number;
  logIndex: number;
  txHash: string;
  token: string;
  symbol: string;
  fromAddr: string;
  toAddr: string;
  amount: number;
  usdValue: number;
  ts: Date;
}

export interface TokenSummary {
  symbol: string;
  address: string;
  priceUsd: number | null;
  change24h: number | null;
  volumeUsd: number;
  transfers: number;
  spark: number[];
}

export interface WalletMover {
  address: string;
  inflowUsd: number;
  outflowUsd: number;
  netUsd: number;
  txCount: number;
  topToken: string;
  label: string | null;
}

export interface LiveAlert {
  id: string;
  kind: "price_spike" | "whale_move" | "volume_spike";
  severity: 1 | 2 | 3 | 4 | 5;
  token: string;
  headline: string;
  narrative: string;
  txUrl: string | null;
  ago: string;
  ts: Date;
  pct?: number;
  usd?: number;
}

let snapshotCache: LiveSnapshot | null = null;
let inflight: Promise<LiveSnapshot> | null = null;
const SNAPSHOT_TTL_MS = 60_000;

/**
 * Verified Mantle-side labels only. The OP-Stack standard predeploys are
 * deterministic and safe to claim. Everything else (CEX hot wallets, DEX
 * routers, treasury) ships unlabeled until we wire up the real label
 * pipeline (Etherscan tags + behavioral clustering) in the indexer.
 *
 * Better an honest "unlabeled · USDe" than a confident wrong claim.
 */
const KNOWN_LABELS: Record<string, string> = {
  // OP-Stack predeploys (deterministic across all OP-Stack chains incl. Mantle)
  "0x4200000000000000000000000000000000000007": "L2 Cross-Domain Messenger",
  "0x4200000000000000000000000000000000000010": "L2 Standard Bridge",
  "0x4200000000000000000000000000000000000011": "L2 Sequencer Fee Vault",
  "0x4200000000000000000000000000000000000016": "L2 To L1 Message Passer",
  "0x000000000000000000000000000000000000dead": "Burn",
  "0x0000000000000000000000000000000000000000": "Zero (mint/burn)",
};

function fmtPct(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function fmtUsdShort(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function relTime(d: Date): string {
  const s = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (s < 60) return `${Math.round(s)}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  return `${Math.round(s / 3600)}h ago`;
}

/* ------------------ snapshot builder ------------------ */

const BLOCKS_TO_SCAN = 250; // ~8 minutes on Mantle (≈2s/block)

export async function getLiveSnapshot(force = false): Promise<LiveSnapshot> {
  if (!force && snapshotCache && Date.now() - snapshotCache.ts < SNAPSHOT_TTL_MS) {
    return snapshotCache;
  }
  // Single-flight: while one request is computing, all callers await it.
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      return await computeSnapshot();
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

async function computeSnapshot(): Promise<LiveSnapshot> {
  await fetchPrices();
  const head = await client.getBlockNumber();
  const fromBlock = head - BigInt(BLOCKS_TO_SCAN);

  let logs: Log[] = [];
  try {
    logs = await client.getLogs({
      address: WATCHED_ADDRESSES,
      event: TRANSFER_EVENT,
      fromBlock,
      toBlock: head,
    });
  } catch {
    logs = [];
  }

  const blockMap = new Map<number, Date>();
  const blocksToFetch = [...new Set(logs.map((l) => Number(l.blockNumber)))].slice(0, 24);
  await Promise.all(
    blocksToFetch.map(async (n) => {
      try {
        const b = await client.getBlock({ blockNumber: BigInt(n) });
        blockMap.set(n, new Date(Number(b.timestamp) * 1000));
      } catch {
        // ignore
      }
    }),
  );
  const headBlock = await client.getBlock({ blockNumber: head });
  const headTs = new Date(Number(headBlock.timestamp) * 1000);

  const transfers: ParsedTransfer[] = [];
  for (const lg of logs) {
    try {
      const decoded = decodeEventLog({ abi: erc20Abi, data: lg.data, topics: lg.topics });
      if (decoded.eventName !== "Transfer") continue;
      const { from, to, value } = decoded.args as { from: string; to: string; value: bigint };
      const tok = TOKENS_BY_ADDRESS.get(lg.address.toLowerCase());
      if (!tok) continue;
      const amount = Number(value) / 10 ** tok.decimals;
      const price = priceCache.get(tok.symbol.toUpperCase())?.usd ?? null;
      const usdValue = price ? amount * price : 0;
      const ts = blockMap.get(Number(lg.blockNumber)) ?? headTs;
      transfers.push({
        blockNumber: Number(lg.blockNumber),
        logIndex: lg.logIndex ?? 0,
        txHash: lg.transactionHash!,
        token: lg.address.toLowerCase(),
        symbol: tok.symbol,
        fromAddr: from.toLowerCase(),
        toAddr: to.toLowerCase(),
        amount,
        usdValue,
        ts,
      });
    } catch {
      // skip undecodable
    }
  }
  transfers.sort((a, b) => b.usdValue - a.usdValue);

  /* per-token rollup with sparkline */
  const byToken = new Map<string, ParsedTransfer[]>();
  for (const t of transfers) {
    const list = byToken.get(t.symbol) ?? [];
    list.push(t);
    byToken.set(t.symbol, list);
  }

  const topByToken: TokenSummary[] = Object.values(TOKENS).map((tok) => {
    const list = byToken.get(tok.symbol) ?? [];
    const volumeUsd = list.reduce((acc, t) => acc + t.usdValue, 0);
    const price = priceCache.get(tok.symbol.toUpperCase());

    // Sparkline = volume per ~equal-time bucket across the window
    const buckets = 16;
    const spark: number[] = new Array(buckets).fill(0);
    if (list.length > 0) {
      const start = Math.min(...list.map((t) => t.ts.getTime()));
      const end = Math.max(...list.map((t) => t.ts.getTime()));
      const span = Math.max(1, end - start);
      for (const t of list) {
        const idx = Math.min(buckets - 1, Math.floor(((t.ts.getTime() - start) / span) * buckets));
        spark[idx] = (spark[idx] ?? 0) + t.usdValue;
      }
    }

    return {
      symbol: tok.symbol,
      address: tok.address,
      priceUsd: price?.usd ?? null,
      change24h: price?.change24h ?? null,
      volumeUsd,
      transfers: list.length,
      spark,
    };
  });
  topByToken.sort((a, b) => b.volumeUsd - a.volumeUsd);

  /* wallet rollup */
  const byWallet = new Map<string, { in: number; out: number; n: number; topToken: string }>();
  for (const t of transfers) {
    const f = byWallet.get(t.fromAddr) ?? { in: 0, out: 0, n: 0, topToken: t.symbol };
    f.out += t.usdValue;
    f.n++;
    f.topToken = t.usdValue > (byWallet.get(t.fromAddr)?.out ?? 0) ? t.symbol : f.topToken;
    byWallet.set(t.fromAddr, f);
    const g = byWallet.get(t.toAddr) ?? { in: 0, out: 0, n: 0, topToken: t.symbol };
    g.in += t.usdValue;
    g.n++;
    g.topToken = t.usdValue > (byWallet.get(t.toAddr)?.in ?? 0) ? t.symbol : g.topToken;
    byWallet.set(t.toAddr, g);
  }

  const topMovers: WalletMover[] = [...byWallet.entries()]
    .map(([address, v]) => ({
      address,
      inflowUsd: v.in,
      outflowUsd: v.out,
      netUsd: v.in - v.out,
      txCount: v.n,
      topToken: v.topToken,
      label: KNOWN_LABELS[address] ?? null,
    }))
    .filter((w) => w.inflowUsd + w.outflowUsd > 1_000)
    .sort((a, b) => b.inflowUsd + b.outflowUsd - (a.inflowUsd + a.outflowUsd))
    .slice(0, 25);

  /* alerts: synthesize from real data
   * Goal: produce at least 4 textured alerts across the spectrum, even on a
   * quiet chain. We mix three sources: (1) significant 24h price moves with
   * real on-chain flow this window, (2) the biggest transfers of the window,
   * (3) volume spikes inferred from flow concentration.
   */
  const alerts: LiveAlert[] = [];

  /* (1) Price-spike alerts — only for tokens with real flow this window */
  for (const t of topByToken) {
    if (t.change24h === null || Math.abs(t.change24h) < 1.5) continue;
    if (t.transfers === 0) continue; // no on-chain action — skip
    const dir = t.change24h > 0 ? "up" : "down";
    const labeled = topMovers.find((m) => m.topToken === t.symbol && m.label)?.label;
    const flowPhrase =
      t.volumeUsd >= 50_000
        ? ` on ${fmtUsdShort(t.volumeUsd)} of flow across ${t.transfers} transfer${t.transfers === 1 ? "" : "s"}`
        : `, with light on-chain volume so far (${fmtUsdShort(t.volumeUsd)} across ${t.transfers} transfer${t.transfers === 1 ? "" : "s"})`;
    const actorPhrase = labeled ? ` led by ${labeled}` : "";
    alerts.push({
      id: `price-${t.symbol}`,
      kind: "price_spike",
      severity: Math.min(5, Math.max(1, Math.round(Math.abs(t.change24h) / 1.5))) as 1 | 2 | 3 | 4 | 5,
      token: t.symbol,
      headline: `${t.symbol} ${dir} ${fmtPct(t.change24h)} · 24h`,
      narrative: `${t.symbol} is ${dir} ${fmtPct(t.change24h)} on the day${flowPhrase}${actorPhrase}.`,
      txUrl: null,
      ago: "live",
      ts: headTs,
      pct: t.change24h,
    });
  }

  /* (2) Whale moves — top transfers in the window, dynamic threshold */
  const whaleThreshold = transfers[0]?.usdValue && transfers[0].usdValue < 250_000 ? 25_000 : 100_000;
  for (const t of transfers.slice(0, 5)) {
    if (t.usdValue < whaleThreshold) break;
    const fromLabel = KNOWN_LABELS[t.fromAddr];
    const toLabel = KNOWN_LABELS[t.toAddr];
    const isCexFrom = fromLabel?.match(/Bybit|OKX|Binance/);
    const isCexTo = toLabel?.match(/Bybit|OKX|Binance/);
    const dir = isCexFrom ? "withdrawal" : isCexTo ? "deposit" : "transfer";

    let narrative: string;
    if (fromLabel && toLabel) {
      narrative = `${fmtUsdShort(t.usdValue)} ${t.symbol} just moved from ${fromLabel} to ${toLabel} (block ${t.blockNumber}, ${relTime(t.ts)}).`;
    } else if (fromLabel) {
      narrative = `${fmtUsdShort(t.usdValue)} ${t.symbol} just left ${fromLabel} for a wallet with no public label — ${relTime(t.ts)}.`;
    } else if (toLabel) {
      narrative = `${fmtUsdShort(t.usdValue)} ${t.symbol} arrived at ${toLabel} from an unlabeled wallet — ${relTime(t.ts)}.`;
    } else {
      narrative = `${fmtUsdShort(t.usdValue)} ${t.symbol} moved between two unlabeled wallets at block ${t.blockNumber} (${relTime(t.ts)}).`;
    }

    alerts.push({
      id: `whale-${t.txHash}-${t.logIndex}`,
      kind: "whale_move",
      severity: Math.min(5, Math.max(1, Math.round(Math.log10(t.usdValue) - 3))) as 1 | 2 | 3 | 4 | 5,
      token: t.symbol,
      headline: `${fmtUsdShort(t.usdValue)} ${t.symbol} ${dir}${fromLabel || toLabel ? ` · ${(fromLabel ?? toLabel)?.split(" ")[0]}` : ""}`,
      narrative,
      txUrl: `https://mantlescan.xyz/tx/${t.txHash}`,
      ago: relTime(t.ts),
      ts: t.ts,
      usd: t.usdValue,
    });
  }

  /* (3) Volume spikes — flag any token where >70% of window volume is in last quarter */
  for (const t of topByToken) {
    if (t.volumeUsd < 25_000 || t.spark.length < 4) continue;
    const lastQuarter = t.spark.slice(Math.floor(t.spark.length * 0.75)).reduce((a, b) => a + b, 0);
    const concentration = lastQuarter / Math.max(1, t.volumeUsd);
    if (concentration < 0.7) continue;
    alerts.push({
      id: `vol-${t.symbol}`,
      kind: "volume_spike",
      severity: 3,
      token: t.symbol,
      headline: `${t.symbol} flow accelerating · ${Math.round(concentration * 100)}% in last 2m`,
      narrative: `${t.symbol} just had ${Math.round(concentration * 100)}% of its 8-minute volume (${fmtUsdShort(t.volumeUsd)}) land in the past two minutes — concentrated activity, often a precursor to a price move.`,
      txUrl: null,
      ago: "live",
      ts: headTs,
    });
  }

  /* (4) If chain is unusually quiet, emit a calm-market read so the
   * dashboard never looks broken — the agent narrating silence is itself
   * useful information. */
  if (alerts.length < 3) {
    const top = topByToken.find((t) => t.transfers > 0);
    if (top) {
      alerts.push({
        id: `calm-${top.symbol}`,
        kind: "volume_spike",
        severity: 1,
        token: top.symbol,
        headline: `Quiet window · ${top.symbol} leads with ${fmtUsdShort(top.volumeUsd)}`,
        narrative: `Mantle is calm right now. The most active token in the past ${Math.round(BLOCKS_TO_SCAN * 2 / 60)} minutes is ${top.symbol} at ${fmtUsdShort(top.volumeUsd)} across ${top.transfers} transfer${top.transfers === 1 ? "" : "s"}. The detector stays patient — most blocks pass without comment.`,
        txUrl: null,
        ago: "live",
        ts: headTs,
      });
    }
  }

  alerts.sort((a, b) => {
    // Hero priority: prefer alerts with txUrl (real on-chain event), then severity
    const aReal = a.txUrl ? 1 : 0;
    const bReal = b.txUrl ? 1 : 0;
    if (aReal !== bReal) return bReal - aReal;
    return b.severity - a.severity;
  });

  const prices = Object.fromEntries(priceCache.entries());

  snapshotCache = {
    ts: Date.now(),
    blockNumber: Number(head),
    blockTs: headTs,
    windowSec: BLOCKS_TO_SCAN * 2,
    transfers,
    topByToken,
    topMovers,
    alerts,
    prices,
    walletCount: byWallet.size,
  };
  return snapshotCache;
}

export function isLiveDemoMode(): boolean {
  return !process.env.DATABASE_URL || process.env.LIVE_MODE === "1";
}
