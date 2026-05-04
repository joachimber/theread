/**
 * Venice.ai inference client used to call Z.ai's GLM-5.1 (open-source from
 * Zhiyuan AI) as the primary narrator. Same role Claude held; switched
 * because Z.ai is a hackathon judge and the open-weights pedigree fits the
 * "verifiable agent" pitch.
 *
 * Caches per-headline so we don't burn tokens on every dashboard render.
 */

const VENICE_URL = "https://api.venice.ai/api/v1/chat/completions";
const DEFAULT_MODEL = process.env.VENICE_MODEL ?? "zai-org-glm-5-1";

const SYSTEM_PROMPT = `You are "The Read" — an on-chain market narrator for Mantle.

Given a structured anomaly detection (price spike, volume spike, whale move, or flow shift) with named wallet actors, write 1-2 punchy sentences explaining what just happened.

Style rules:
- Lead with the move: dollar size, percent, or direction. Use exact numbers from the input.
- Name wallets by their LABEL, never by address. If no label, say "an unlabeled wallet" or "a fresh wallet".
- Plain English. No jargon (no "sigma", "delta-neutral", "TVL", "alpha"). Say "4x normal volume" not "4σ above baseline".
- No editorializing or predictions. Don't say "expect", "could", "watch for". Just describe.
- 2 sentences max. Often 1 is enough.
- No emojis. No buzzwords. Don't start with "🚨" or "ALERT:" — the wrapper handles that.

Output only the narrative, no preamble.`;

interface VeniceArgs {
  kind: string;
  token?: string;
  metrics?: Record<string, unknown>;
  actors?: Array<{ labels?: string[]; usdValue?: number; action?: string; token?: string }>;
  fallback: string;
}

const inflightCache = new Map<string, Promise<string>>();
const resultCache = new Map<string, { text: string; ts: number }>();
const TTL_MS = 5 * 60_000;

function cacheKey(args: VeniceArgs): string {
  return JSON.stringify({ k: args.kind, t: args.token, m: args.metrics });
}

export async function veniceNarrate(args: VeniceArgs): Promise<{ text: string; via: "venice" | "fallback" }> {
  if (!process.env.VENICE_API_KEY) {
    return { text: args.fallback, via: "fallback" };
  }

  const key = cacheKey(args);
  const cached = resultCache.get(key);
  if (cached && Date.now() - cached.ts < TTL_MS) {
    return { text: cached.text, via: "venice" };
  }
  const inflight = inflightCache.get(key);
  if (inflight) {
    const text = await inflight;
    return { text, via: "venice" };
  }

  const promise = (async () => {
    try {
      const userMessage = JSON.stringify({
        kind: args.kind,
        token: args.token,
        metrics: args.metrics,
        actors: args.actors,
      });
      const res = await fetch(VENICE_URL, {
        method: "POST",
        headers: {
          authorization: `Bearer ${process.env.VENICE_API_KEY}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          max_tokens: 240,
          temperature: 0.5,
          venice_parameters: { disable_thinking: true },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
        }),
        next: { revalidate: 60 },
      });
      if (!res.ok) throw new Error(`venice ${res.status}`);
      const body = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = body.choices?.[0]?.message?.content?.trim();
      if (!text) throw new Error("empty venice response");
      resultCache.set(key, { text, ts: Date.now() });
      return text;
    } catch {
      return args.fallback;
    } finally {
      inflightCache.delete(key);
    }
  })();

  inflightCache.set(key, promise);
  const text = await promise;
  return { text, via: process.env.VENICE_API_KEY ? "venice" : "fallback" };
}
