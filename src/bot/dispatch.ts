import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { alerts as alertsTable } from "../db/schema.js";
import { env } from "../lib/env.js";
import { log } from "../lib/log.js";
import { sendTelegram } from "./telegram.js";
import { sendDiscord } from "./discord.js";

export interface AlertPayload {
  id: number;
  headline: string;
  narrative: string;
  severity: number;
  txUrl: string | null;
  kind: string;
  token?: string;
}

const SEVERITY_PREFIX = ["", "·", "·", "‼", "‼", "🔴"];

function format(payload: AlertPayload): string {
  const prefix = SEVERITY_PREFIX[payload.severity] ?? "·";
  const link = payload.txUrl ? `\n${payload.txUrl}` : "";
  return `${prefix} ${payload.headline}\n${payload.narrative}${link}`;
}

export async function dispatchAlert(payload: AlertPayload): Promise<void> {
  const text = format(payload);
  const tasks: Promise<{ ok: boolean; channel: string }>[] = [];

  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHANNEL_ID) {
    tasks.push(
      sendTelegram(text)
        .then(() => ({ ok: true, channel: "telegram" }))
        .catch((err) => {
          log.warn({ err: String(err) }, "telegram send failed");
          return { ok: false, channel: "telegram" };
        }),
    );
  }

  if (env.DISCORD_WEBHOOK_URL) {
    tasks.push(
      sendDiscord(text)
        .then(() => ({ ok: true, channel: "discord" }))
        .catch((err) => {
          log.warn({ err: String(err) }, "discord send failed");
          return { ok: false, channel: "discord" };
        }),
    );
  }

  const results = await Promise.all(tasks);
  const tg = results.find((r) => r.channel === "telegram")?.ok ?? false;
  const dc = results.find((r) => r.channel === "discord")?.ok ?? false;

  if (tg || dc) {
    await db
      .update(alertsTable)
      .set({ deliveredTelegram: tg, deliveredDiscord: dc })
      .where(eq(alertsTable.id, payload.id));
  }
}
