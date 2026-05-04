import { Telegraf } from "telegraf";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { alerts as alertsTable, walletLabels, wallets, walletStats } from "../db/schema.js";
import { env } from "../lib/env.js";
import { log } from "../lib/log.js";
import { fmtAddr, fmtUsd, fmtRel } from "../lib/format.js";

let bot: Telegraf | null = null;

function getBot(): Telegraf | null {
  if (!env.TELEGRAM_BOT_TOKEN) return null;
  if (!bot) {
    bot = new Telegraf(env.TELEGRAM_BOT_TOKEN);
    registerCommands(bot);
  }
  return bot;
}

function registerCommands(b: Telegraf): void {
  b.command("start", (ctx) =>
    ctx.reply(
      [
        "The Read — Mantle anomaly narrator",
        "",
        "Commands:",
        "/latest — last 5 alerts",
        "/wallet 0x… — labels + 30d stats",
        "/agent — ERC-8004 agent identity status",
      ].join("\n"),
    ),
  );

  b.command("latest", async (ctx) => {
    const rows = await db
      .select()
      .from(alertsTable)
      .orderBy(desc(alertsTable.createdAt))
      .limit(5);
    if (rows.length === 0) {
      await ctx.reply("No alerts yet — give the indexer a few minutes.");
      return;
    }
    const text = rows
      .map((r) => `${fmtRel(r.createdAt)} · ${r.headline}\n${r.narrative}`)
      .join("\n\n");
    await ctx.reply(text);
  });

  b.command("wallet", async (ctx) => {
    const text = ctx.message.text;
    const match = text.match(/0x[a-fA-F0-9]{40}/);
    if (!match) {
      await ctx.reply("Usage: /wallet 0x…");
      return;
    }
    const addr = match[0].toLowerCase();
    const [w] = await db.select().from(wallets).where(eq(wallets.address, addr)).limit(1);
    if (!w) {
      await ctx.reply(`No on-chain activity recorded for ${fmtAddr(addr)} on Mantle.`);
      return;
    }
    const labels = await db
      .select({ label: walletLabels.label })
      .from(walletLabels)
      .where(eq(walletLabels.address, addr));
    const [stats] = await db.select().from(walletStats).where(eq(walletStats.address, addr)).limit(1);

    const lines = [
      `Wallet ${fmtAddr(addr)}`,
      `Labels: ${labels.length ? labels.map((l) => l.label).join(", ") : "—"}`,
      `30d volume: ${fmtUsd(w.totalVolumeUsd)} across ${w.txCount} transfers`,
      stats ? `Net flow 30d: ${fmtUsd(stats.netUsd)}` : "Stats not yet computed",
      `https://mantlescan.xyz/address/${addr}`,
    ];
    await ctx.reply(lines.join("\n"));
  });

  b.command("agent", async (ctx) => {
    const lines = [
      `Agent: The Read`,
      env.AGENT_IDENTITY_ADDRESS
        ? `Identity contract: ${env.AGENT_IDENTITY_ADDRESS}`
        : "Identity contract: not yet deployed",
      env.AGENT_TOKEN_ID
        ? `Token ID: ${env.AGENT_TOKEN_ID}`
        : "Token ID: not minted",
      "Standard: ERC-8004 (agent identity)",
    ];
    await ctx.reply(lines.join("\n"));
  });
}

export async function sendTelegram(text: string): Promise<void> {
  const b = getBot();
  if (!b || !env.TELEGRAM_CHANNEL_ID) return;
  await b.telegram.sendMessage(env.TELEGRAM_CHANNEL_ID, text, {
    link_preview_options: { is_disabled: true },
  });
}

export async function startTelegramBot(): Promise<void> {
  const b = getBot();
  if (!b) {
    log.warn("TELEGRAM_BOT_TOKEN missing — bot not started");
    return;
  }
  await b.launch();
  log.info("telegram bot launched");
  process.once("SIGINT", () => b.stop("SIGINT"));
  process.once("SIGTERM", () => b.stop("SIGTERM"));
}
