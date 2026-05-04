/**
 * ACP handler for `narrate_event`. Receives a structured anomaly, calls
 * Venice (Z.ai GLM-5.1), returns the 1-2 sentence narrative.
 *
 * Drops in to ACP's seller runtime alongside `offering.json`. The runtime
 * provides the typed `executeJob` shape; we keep this minimal and self-
 * contained so the file works as-is when copied into the ACP repo.
 */

interface JobPayload {
  kind: string;
  token: string;
  metrics?: Record<string, unknown>;
  actors?: Array<{ labels?: string[]; usdValue?: number; action?: string; token?: string }>;
}

const VENICE_URL = "https://api.venice.ai/api/v1/chat/completions";
const VENICE_MODEL = process.env.VENICE_MODEL ?? "zai-org-glm-5-1";

const SYSTEM_PROMPT = `You are "The Read" — an on-chain market narrator for Mantle.
Given a structured anomaly with named wallet actors, return 1-2 punchy sentences explaining what happened.
Lead with the move. Name wallets by their LABEL only. Plain English. No emojis. No buzzwords. No editorializing.
Output only the narrative, no preamble.`;

export async function executeJob(payload: JobPayload): Promise<{ narrative: string; via: string }> {
  if (!process.env.VENICE_API_KEY) {
    throw new Error("VENICE_API_KEY not set on the ACP seller runtime");
  }

  const userMessage = JSON.stringify({
    kind: payload.kind,
    token: payload.token,
    metrics: payload.metrics ?? {},
    actors: payload.actors ?? [],
  });

  const res = await fetch(VENICE_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.VENICE_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: VENICE_MODEL,
      max_tokens: 240,
      temperature: 0.5,
      venice_parameters: { disable_thinking: true },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!res.ok) throw new Error(`venice ${res.status}: ${await res.text()}`);

  const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const narrative = body.choices?.[0]?.message?.content?.trim();
  if (!narrative) throw new Error("empty venice response");

  return { narrative, via: VENICE_MODEL };
}

/** Optional: validate before charging. Reject obviously malformed payloads. */
export function validate(payload: JobPayload): { ok: true } | { ok: false; reason: string } {
  if (!payload?.kind) return { ok: false, reason: "missing kind" };
  if (!payload?.token) return { ok: false, reason: "missing token" };
  return { ok: true };
}
