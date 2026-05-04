import { env } from "../lib/env.js";

export async function sendDiscord(text: string): Promise<void> {
  if (!env.DISCORD_WEBHOOK_URL) return;
  const res = await fetch(env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ content: text, allowed_mentions: { parse: [] } }),
  });
  if (!res.ok) throw new Error(`discord webhook ${res.status}: ${await res.text()}`);
}
