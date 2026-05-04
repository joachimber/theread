import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/* ========== INDEXER STATE ========== */

export const indexerCursor = pgTable("indexer_cursor", {
  name: varchar("name", { length: 64 }).primaryKey(),
  blockNumber: bigint("block_number", { mode: "number" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const blocks = pgTable("blocks", {
  number: bigint("number", { mode: "number" }).primaryKey(),
  hash: varchar("hash", { length: 66 }).notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
});

/* ========== EVENTS ========== */

export const transfers = pgTable(
  "transfers",
  {
    id: serial("id").primaryKey(),
    blockNumber: bigint("block_number", { mode: "number" }).notNull(),
    logIndex: integer("log_index").notNull(),
    txHash: varchar("tx_hash", { length: 66 }).notNull(),
    token: varchar("token", { length: 42 }).notNull(),
    fromAddr: varchar("from_addr", { length: 42 }).notNull(),
    toAddr: varchar("to_addr", { length: 42 }).notNull(),
    rawAmount: numeric("raw_amount", { precision: 78, scale: 0 }).notNull(),
    amount: real("amount").notNull(),
    usdValue: real("usd_value"),
    ts: timestamp("ts", { withTimezone: true }).notNull(),
  },
  (t) => ({
    uniq: uniqueIndex("transfers_block_log_uniq").on(t.blockNumber, t.logIndex),
    byTs: index("transfers_ts_idx").on(t.ts),
    byTokenTs: index("transfers_token_ts_idx").on(t.token, t.ts),
    byFrom: index("transfers_from_idx").on(t.fromAddr, t.ts),
    byTo: index("transfers_to_idx").on(t.toAddr, t.ts),
  }),
);

export const swaps = pgTable(
  "swaps",
  {
    id: serial("id").primaryKey(),
    blockNumber: bigint("block_number", { mode: "number" }).notNull(),
    logIndex: integer("log_index").notNull(),
    txHash: varchar("tx_hash", { length: 66 }).notNull(),
    pool: varchar("pool", { length: 42 }).notNull(),
    sender: varchar("sender", { length: 42 }).notNull(),
    recipient: varchar("recipient", { length: 42 }).notNull(),
    tokenIn: varchar("token_in", { length: 42 }).notNull(),
    tokenOut: varchar("token_out", { length: 42 }).notNull(),
    amountIn: real("amount_in").notNull(),
    amountOut: real("amount_out").notNull(),
    usdValue: real("usd_value"),
    ts: timestamp("ts", { withTimezone: true }).notNull(),
  },
  (t) => ({
    uniq: uniqueIndex("swaps_block_log_uniq").on(t.blockNumber, t.logIndex),
    byTs: index("swaps_ts_idx").on(t.ts),
    byPool: index("swaps_pool_ts_idx").on(t.pool, t.ts),
    bySender: index("swaps_sender_ts_idx").on(t.sender, t.ts),
  }),
);

/* ========== WALLETS ========== */

export const wallets = pgTable(
  "wallets",
  {
    address: varchar("address", { length: 42 }).primaryKey(),
    firstSeen: timestamp("first_seen", { withTimezone: true }).notNull(),
    lastSeen: timestamp("last_seen", { withTimezone: true }).notNull(),
    txCount: integer("tx_count").default(0).notNull(),
    totalVolumeUsd: real("total_volume_usd").default(0).notNull(),
    score: real("score").default(0).notNull(),
    isContract: boolean("is_contract").default(false).notNull(),
    notes: text("notes"),
  },
  (t) => ({
    byScore: index("wallets_score_idx").on(t.score),
    byVolume: index("wallets_volume_idx").on(t.totalVolumeUsd),
  }),
);

export const walletLabels = pgTable(
  "wallet_labels",
  {
    id: serial("id").primaryKey(),
    address: varchar("address", { length: 42 }).notNull(),
    label: varchar("label", { length: 64 }).notNull(),
    /** "manual" | "heuristic:<rule>" | "import:<source>" */
    source: varchar("source", { length: 64 }).notNull(),
    confidence: real("confidence").default(1).notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    byAddr: index("labels_addr_idx").on(t.address),
    uniqLabel: uniqueIndex("labels_addr_label_uniq").on(t.address, t.label, t.source),
  }),
);

/** Rolling 30d wallet activity used by the narrator and dashboard. */
export const walletStats = pgTable("wallet_stats", {
  address: varchar("address", { length: 42 }).primaryKey(),
  windowDays: integer("window_days").default(30).notNull(),
  inflowUsd: real("inflow_usd").default(0).notNull(),
  outflowUsd: real("outflow_usd").default(0).notNull(),
  netUsd: real("net_usd").default(0).notNull(),
  distinctTokens: integer("distinct_tokens").default(0).notNull(),
  swapsCount: integer("swaps_count").default(0).notNull(),
  /** crude PnL proxy: cost-basis vs spot */
  realizedPnlUsd: real("realized_pnl_usd").default(0).notNull(),
  /** % of trades that closed in profit (computed offline) */
  hitRate: real("hit_rate"),
  topTokens: jsonb("top_tokens"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ========== PRICES ========== */

export const prices = pgTable(
  "prices",
  {
    id: serial("id").primaryKey(),
    coingeckoId: varchar("coingecko_id", { length: 64 }).notNull(),
    symbol: varchar("symbol", { length: 16 }).notNull(),
    priceUsd: real("price_usd").notNull(),
    ts: timestamp("ts", { withTimezone: true }).notNull(),
  },
  (t) => ({
    byIdTs: index("prices_id_ts_idx").on(t.coingeckoId, t.ts),
    uniq: uniqueIndex("prices_id_ts_uniq").on(t.coingeckoId, t.ts),
  }),
);

/* ========== ALERTS ========== */

export const alerts = pgTable(
  "alerts",
  {
    id: serial("id").primaryKey(),
    kind: varchar("kind", { length: 32 }).notNull(),
    severity: integer("severity").default(1).notNull(),
    token: varchar("token", { length: 16 }),
    headline: text("headline").notNull(),
    narrative: text("narrative").notNull(),
    /** structured detector output: deltas, top wallets, links */
    context: jsonb("context").notNull(),
    /** sha256 of canonical context for ERC-8004 attestation */
    alertHash: varchar("alert_hash", { length: 66 }).notNull(),
    /** mantlescan link to the move (if single-tx) */
    txUrl: text("tx_url"),
    /** ERC-8004 attestation tx hash on Mantle (filled async) */
    attestationTx: varchar("attestation_tx", { length: 66 }),
    deliveredTelegram: boolean("delivered_telegram").default(false).notNull(),
    deliveredDiscord: boolean("delivered_discord").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    byCreated: index("alerts_created_idx").on(t.createdAt),
    byKind: index("alerts_kind_idx").on(t.kind),
    uniqHash: uniqueIndex("alerts_hash_uniq").on(t.alertHash),
  }),
);

/** Dedupe key with TTL — prevents narrating the same anomaly twice. */
export const alertCooldowns = pgTable(
  "alert_cooldowns",
  {
    key: varchar("key", { length: 128 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.key] }),
    byExpiry: index("cooldowns_expires_idx").on(t.expiresAt),
  }),
);

/* ========== AGENT IDENTITY (ERC-8004) ========== */

export const agentRegistry = pgTable("agent_registry", {
  id: serial("id").primaryKey(),
  contractAddress: varchar("contract_address", { length: 42 }).notNull(),
  tokenId: varchar("token_id", { length: 78 }).notNull(),
  name: varchar("name", { length: 64 }).notNull(),
  metadataUri: text("metadata_uri").notNull(),
  mintTx: varchar("mint_tx", { length: 66 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
