import Anthropic from "@anthropic-ai/sdk";
import { env } from "../lib/env.js";
import { log } from "../lib/log.js";
import { fmtUsd, fmtPct } from "../lib/format.js";
import { SYSTEM_PROMPT } from "./prompts.js";
import { veniceNarrate } from "./venice.js";
import type { Detection } from "../detector/types.js";

let anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic | null {
  if (!env.ANTHROPIC_API_KEY) return null;
  if (!anthropic) anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return anthropic;
}

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

async function anthropicNarrate(d: Detection): Promise<string | null> {
  const c = getAnthropic();
  if (!c) return null;
  const userMessage = JSON.stringify({
    kind: d.kind,
    token: d.token,
    severity: d.severity,
    windowMin: d.windowMin,
    metrics: d.metrics,
    actors: d.actors.map((a) => ({
      labels: a.labels,
      usdValue: a.usdValue,
      action: a.action,
      token: a.token,
    })),
  });
  try {
    const res = await c.messages.create({
      model: env.NARRATOR_MODEL,
      max_tokens: 200,
      system: [
        { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content: userMessage }],
    });
    const text = res.content
      .filter((c): c is Anthropic.TextBlock => c.type === "text")
      .map((c) => c.text)
      .join("")
      .trim();
    return text || null;
  } catch (err) {
    log.warn({ err: String(err) }, "anthropic narrator failed");
    return null;
  }
}

/**
 * Convert a Detection into 1-2 sentences. Resolution order:
 *   1. Venice.ai (Z.ai GLM-5.1) — primary
 *   2. Anthropic Claude — fallback
 *   3. Hardcoded template — always works
 */
export async function narrate(d: Detection): Promise<string> {
  const venice = await veniceNarrate(d);
  if (venice) return venice;
  const claude = await anthropicNarrate(d);
  if (claude) return claude;
  return fallbackNarrative(d);
}
