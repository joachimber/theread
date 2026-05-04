# The Read

> Watches Mantle 24/7. Explains every market move in one sentence.

A Telegram + Discord bot + dashboard that monitors Mantle's DeFi flows in real time. When a price spike, volume anomaly, or whale move happens, "The Read" generates a one-sentence narrative — naming the wallets behind it, citing exact dollar amounts, and pinning the alert hash on-chain via an ERC-8004 agent identity NFT for verifiable provenance.

Built for the **Turing Test Hackathon 2026 · AI Awakening · Track 2 (AI Alpha & Data)**.

## What it does

```
🟢 MNT up +5.2% in 15m

  MNT is up 5.2% in the last 15 minutes on roughly $6M of buying — Bybit's
  hot wallet led with $4M and a single whale added $2.1M.

  https://mantlescan.xyz/tx/0xabc…   attested ↗ 0xdef…
```

Three loops, all running off live Mantle data:

1. **Indexer** — pulls Transfer events on watched tokens (MNT, mETH, USDe, USDY, fBTC, USDC, USDT, WETH, WBTC), USD-denominates via Coingecko, and rolls up wallet stats.
2. **Detector** — every 30s, runs three detectors over the last 5–60 min: price spike, volume spike (vs 24h baseline), whale move (>$250k from a non-CEX/non-router wallet). Cooldowns prevent the same anomaly firing twice.
3. **Narrator** — feeds each Detection (with named wallet labels) to Claude with a tight prompt; outputs 1–2 sentences in plain English. Falls back to a template if the API key is missing.

Every alert is hashed and recorded on Mantle via `AgentIdentity.recordAlert(tokenId, hash, uri)` — an ERC-8004-shaped contract that gives the agent a verifiable, on-chain track record.

## Architecture

```
                    ┌────────────────┐
                    │  Mantle RPC    │
                    └────────┬───────┘
                             │ (logs)
                  ┌──────────▼──────────┐
                  │      Indexer        │
                  │  + Coingecko prices │
                  │  + Wallet labels    │
                  └──────────┬──────────┘
                             │ writes
                       ┌─────▼─────┐
                       │  Postgres │
                       └─────┬─────┘
                             │ reads
                  ┌──────────▼──────────┐
                  │      Detector       │
                  │ price/volume/whale  │
                  └──────────┬──────────┘
                             │ Detection
                  ┌──────────▼──────────┐
                  │  Narrator (Claude)  │
                  └──────────┬──────────┘
                             │ Alert
       ┌─────────────┬───────┼───────┬─────────────┐
       ▼             ▼       ▼       ▼             ▼
  Telegram      Discord    DB    Dashboard   ERC-8004 attest
                                            (Mantle on-chain)
```

## Setup

### 1. Toolchain

- Node 22+
- Postgres (Neon free tier works)
- Foundry (only if you want to deploy the contract)

### 2. Database

Create a Neon (or Railway/Supabase) Postgres database, copy its `DATABASE_URL`, and:

```bash
cp .env.example .env
# fill in DATABASE_URL, ANTHROPIC_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID

npm install
npm run db:push     # creates tables
npm run label       # seeds known Mantle entity labels
```

### 3. Run

Single-process (dev):

```bash
npm run dev
# → indexer + price worker + detector + Telegram bot
```

Per-process (production):

```bash
npm run indexer    # one container
npm run detector   # one container
npm run bot        # one container
```

### 4. Dashboard

```bash
cd web
npm install
npm run dev   # http://localhost:3030
```

### 5. Deploy ERC-8004 contract (optional but recommended for the demo)

```bash
cd contracts
forge install
forge build
forge test                                          # 10 tests, all pass

# Mantle Sepolia (testnet)
forge script script/Deploy.s.sol \
  --rpc-url https://rpc.sepolia.mantle.xyz \
  --private-key $DEPLOYER_PRIVATE_KEY --broadcast

# Then back at the root:
AGENT_IDENTITY_ADDRESS=0x… AGENT_TOKEN_ID=1 MINT_TX=0x… npm run register-agent
```

The deploy script logs:
```
AgentIdentity deployed at: 0x…
The Read tokenId: 1
```

Paste those into `.env` (`AGENT_IDENTITY_ADDRESS`, `AGENT_TOKEN_ID`) and the detector will start posting attestations on every alert.

### 6. Seed demo alerts (for live demos before the indexer is warm)

```bash
npm run seed
```

## Telegram bot commands

- `/latest` — last 5 alerts
- `/wallet 0x…` — labels + 30d stats for any wallet
- `/agent` — ERC-8004 identity status

## Repo layout

```
src/
├── lib/        # env, chain client, tokens, ABIs, formatting
├── db/         # Drizzle schema + client
├── indexer/    # block/transfer ingest, coingecko prices, label heuristics
├── detector/   # price/volume/whale detectors + cooldown
├── narrator/   # Claude prompt + on-chain attestation
├── bot/        # Telegram + Discord delivery
├── scripts/    # backfill, seed, label, register-agent
└── runner.ts   # single-process orchestrator

web/            # Next.js 15 dashboard (separate Vercel deploy)
contracts/      # AgentIdentity.sol + foundry tests + deploy script
```

## Why this wins Track 2

- **Legible.** Every alert is one sentence. A non-trader gets it.
- **Live.** Auto-refresh every 5s. Demos itself during the live-stream.
- **Verifiable.** Every alert hash is attested on Mantle. Judges can audit
  the agent's track record after the contest, not just believe screenshots.
- **Mantle-native.** Tokens, pools, and entity labels are all Mantle-specific:
  mETH, USDe, USDY, Merchant Moe, Agni, Bybit hot wallets.
- **Built for both judging and consumer use.** The same product that wins the
  hackathon ships as a real Telegram bot the day after.

## License

MIT
