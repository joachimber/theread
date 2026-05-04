import { env } from "../lib/env.js";
import { fmtUsd, fmtPct } from "../lib/format.js";
import { veniceNarrate } from "./venice.js";
import type { Detection } from "../detector/types.js";

function fallbackNarrative(d: Detection): string {
  const top = d.actors[0];
  const label = top?.labels?.[0] ?? (top?.address ? "an unlabeled wallet" : "");
  const usd = top?.usdValue ? fmtUsd(top.usdValue) : "";
  switch (d.kind) {
    case "price_spike":
      return `${d.token ?? "Token"} ${Number(d.metrics.pct ?? 0) > 0 ? "is up" : "dropped"} ${fmtPct(Number(d.metrics.pct ?? 0))} in the last ${d.windowMin}m${label ? `, led by ${label} (${usd})` : ""}.`;
    case "volume_spike":
      return `${d.token ?? "Token"} volume just hit ${fmtUsd(Number(d.metrics.currentUsd ?? 0))} in the last hour, well above its 24h average${label ? `; biggest mover was ${label} (${usd})` : ""}.`;
    case "whale_move":
      return `${fmtUsd(Number(d.metrics.usd ?? 0))} ${d.token ?? ""} just moved between addresses${label ? ` — ${label}` : ""}.`;
    default:
      return d.headline;
  }
}

/**
 * Convert a Detection into 1-2 sentences. Resolution order:
 *   1. Venice (Z.ai GLM-5.1) — primary
 *   2. Hardcoded template — always works
 */
export async function narrate(d: Detection): Promise<string> {
  // Bind env so the import isn't pruned even if VENICE_API_KEY is unset.
  void env.VENICE_API_KEY;
  const text = await veniceNarrate(d);
  return text || fallbackNarrative(d);
}
