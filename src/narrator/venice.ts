/**
 * Venice.ai client — calls Z.ai's open-weights GLM-5.1 as the narrator.
 * E2EE inference path; the model itself is fully open-weights.
 */
import { env } from "../lib/env.js";
import { log } from "../lib/log.js";
import { SYSTEM_PROMPT } from "./prompts.js";
import type { Detection } from "../detector/types.js";

const VENICE_URL = "https://api.venice.ai/api/v1/chat/completions";

export async function veniceNarrate(d: Detection): Promise<string | null> {
  if (!env.VENICE_API_KEY) return null;
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
    const res = await fetch(VENICE_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.VENICE_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: env.VENICE_MODEL,
        max_tokens: 220,
        temperature: 0.5,
        venice_parameters: { disable_thinking: true },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      }),
    });
    if (!res.ok) {
      log.warn({ status: res.status }, "venice non-200");
      return null;
    }
    const body = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return body.choices?.[0]?.message?.content?.trim() ?? null;
  } catch (err) {
    log.warn({ err: String(err) }, "venice call failed");
    return null;
  }
}
