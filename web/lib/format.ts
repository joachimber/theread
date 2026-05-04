/** Formatting helpers shared across narrator, bot, and dashboard. */

export function fmtUsd(n: number, opts: { compact?: boolean } = {}): string {
  if (!Number.isFinite(n)) return "$—";
  const abs = Math.abs(n);
  if (opts.compact !== false && abs >= 1_000_000_000) return `$${(n / 1e9).toFixed(2)}B`;
  if (opts.compact !== false && abs >= 1_000_000) return `$${(n / 1e6).toFixed(2)}M`;
  if (opts.compact !== false && abs >= 1_000) return `$${(n / 1e3).toFixed(1)}K`;
  if (abs >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(4)}`;
}

export function fmtPct(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}

export function fmtAddr(addr: string): string {
  if (!addr) return "—";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function fmtRel(ts: Date | number): string {
  const t = typeof ts === "number" ? ts : ts.getTime();
  const seconds = Math.max(0, (Date.now() - t) / 1000);
  if (seconds < 60) return `${Math.round(seconds)}s ago`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h ago`;
  return `${Math.round(seconds / 86400)}d ago`;
}
