import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  MANTLE_RPC_URL: z.string().url().default("https://rpc.mantle.xyz"),
  MANTLE_WS_URL: z.string().default("wss://ws.mantle.xyz"),
  MANTLE_CHAIN_ID: z.coerce.number().default(5000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  VENICE_API_KEY: z.string().optional(),
  VENICE_MODEL: z.string().default("zai-org-glm-5-1"),
  ELFA_API_KEY: z.string().optional(),
  NANSEN_API_KEY: z.string().optional(),

  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHANNEL_ID: z.string().optional(),
  DISCORD_WEBHOOK_URL: z.string().url().optional().or(z.literal("")),

  INDEXER_START_BLOCK: z.coerce.number().optional(),
  INDEXER_BATCH_SIZE: z.coerce.number().default(100),
  INDEXER_POLL_MS: z.coerce.number().default(2000),

  PRICE_SPIKE_PCT: z.coerce.number().default(3.0),
  PRICE_SPIKE_WINDOW_MIN: z.coerce.number().default(15),
  VOLUME_SPIKE_SIGMA: z.coerce.number().default(3.0),
  WHALE_USD_THRESHOLD: z.coerce.number().default(250_000),
  ALERT_COOLDOWN_MIN: z.coerce.number().default(30),
  /** Skip on-chain attestation for alerts below this severity (1-5). */
  ATTESTATION_SEVERITY_FLOOR: z.coerce.number().default(3),
  /** Hard daily cap on on-chain attestations to bound MNT burn. */
  ATTESTATION_DAILY_CAP: z.coerce.number().default(30),

  AGENT_IDENTITY_ADDRESS: z.string().optional(),
  AGENT_TOKEN_ID: z.string().optional(),
  DEPLOYER_PRIVATE_KEY: z.string().optional(),

  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
});

export type Env = z.infer<typeof schema>;

export const env: Env = (() => {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment:", parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
})();
