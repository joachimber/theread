# The Read

> An autonomous agent that watches Mantle 24/7 and explains every market move in one sentence — with on-chain provenance.

[Live demo](https://theread.xyz) · [Telegram bot](https://t.me/theread_mantle_bot) · [Pitch](#one-line-pitch)

Built for the **Mantle × Turing Test Hackathon 2026 · AI Awakening · Track 2 (Alpha & Data)**.

## One-line pitch

> The Read is a Mantle-native AI agent that turns raw on-chain noise into a one-sentence narrative — every alert is hashed and pinned on Mantle via an ERC-8004 identity NFT, so its track record is verifiable, not anecdotal.

## What it does

```
🟢 MNT up +5.2% in the last 15 minutes

  A Bybit hot wallet acquired four million dollars of MNT,
  triggering a 5.2 percent price surge in fifteen minutes.

  https://mantlescan.xyz/tx/0xabc…   attested ↗ 0xdef…
  via Z.ai GLM-5.1 · narrated through Venice (E2EE inference)
```

Three loops, all running off live Mantle data:

1. **Indexer** — viem-based RPC client streaming Transfer + Swap events on watched tokens (mETH, USDe, USDY, fBTC, MNT, USDC, USDT, WETH, WBTC). Coingecko prices, wallet rollups, heuristic labelers (whale, MEV, contracts, OP-Stack predeploys).
2. **Detector** — three real detectors: price spike (% change vs window), volume spike (σ vs 24h baseline), whale move ($ threshold). Cooldowns prevent dupes; swap legs collapse so a routed DEX trade doesn't fire twice.
3. **Narrator** — **Z.ai GLM-4.7 Flash** via Venice. Open-weights model, E2EE inference. ~11× cheaper than GLM-5.1 with output that's plenty good for "rewrite this JSON as a sentence". Templated fallback if the API call fails so the pipeline never blocks.

Every alert is hashed and recorded on Mantle via `AgentIdentity.recordAlert(tokenId, hash, uri)` — an ERC-8004-shaped contract that gives the agent a verifiable, on-chain track record.

## Track 2 submission answers

> **Which data sources does your project use?**
>
> Mantle public RPC (block + log streams), Coingecko (USD prices), Nansen (deep-link wallet research), Elfa AI (social mindshare). The detector and dashboard both read directly from chain — no third-party indexer in the hot path.

> **What role does AI play?**
>
> The detector is statistical — it produces structured anomaly objects. The AI's job is *only* the last mile: rewrite a structured detection into a one-sentence narrative an analyst would say. We use Z.ai's open-weights GLM-4.7 Flash (via Venice for E2EE inference). Templated narratives are the always-works floor. The agent never invents numbers — every figure in a narrative comes from the detector.

> **How does it generate verifiable value on Mantle?**
>
> Two ways. (1) Every emitted alert posts `recordAlert(tokenId, hash, uri)` to our `AgentIdentity` contract on Mantle, creating a permanent on-chain log of what the agent said and when. Anyone can audit hit-rate after the fact. (2) The dashboard renders against live Mantle RPC — every number, address, and sparkline is decoded on render, not pre-computed.

## Architecture

```
                   ┌────────────────┐
                   │  Mantle RPC    │
                   └────────┬───────┘
                            │ logs + blocks
                 ┌──────────▼──────────┐
                 │      Indexer        │ ── Coingecko prices ──┐
                 │   (Transfers,       │                       │
                 │    wallet rollup)   │                       │
                 └──────────┬──────────┘                       │
                            │ writes                            │
                      ┌─────▼─────┐                             │
                      │  Postgres │                             │
                      └─────┬─────┘                             │
                            │ reads                            │
                 ┌──────────▼──────────┐         ┌─────────────▼─────┐
                 │     Detector        │         │   Web dashboard   │
                 │ price/volume/whale  │         │  (live on render) │
                 └──────────┬──────────┘         └─────────┬─────────┘
                            │ Detection                    │
              ┌─────────────▼─────────────┐                │
              │ Narrator                  │                │
              │ ① Z.ai GLM-4.7 Flash      │                │
              │ ② template fallback       │                │
              └─────────────┬─────────────┘                │
                            │ Alert                         │
       ┌─────────┬──────────┼──────────┬────────┐          │
       ▼         ▼          ▼          ▼        ▼          ▼
   Telegram  Discord       DB    ERC-8004 attest   Dashboard feed
                                 (Mantle on-chain)
```

## Setup

### 1. Toolchain

- Node 22+
- Postgres (Neon free tier works)
- Foundry (only for the contract deploy)

### 2. Database

Provision a Neon (or Railway/Supabase) Postgres database, copy its `DATABASE_URL`, then:

```bash
cp .env.example .env
# fill in DATABASE_URL, VENICE_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID

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

The dashboard works without a database — it falls back to pulling 250 blocks of live Mantle RPC data on each render.

### 5. Deploy ERC-8004 contract

```bash
cd contracts
forge install
forge build
forge test                                          # 10 tests, all pass

# Mantle Sepolia (testnet)
forge script script/Deploy.s.sol \
  --rpc-url https://rpc.sepolia.mantle.xyz \
  --private-key $DEPLOYER_PRIVATE_KEY --broadcast

# Mantle mainnet
forge script script/Deploy.s.sol \
  --rpc-url $MANTLE_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY --broadcast \
  --verify --etherscan-api-key $MANTLESCAN_API_KEY
```

The deploy script logs:
```
AgentIdentity deployed at: 0x…
The Read tokenId: 1
```

Paste those into `.env` (`AGENT_IDENTITY_ADDRESS`, `AGENT_TOKEN_ID`) and run:

```bash
MINT_TX=0x… npm run register-agent
```

The detector now posts attestations on every alert.

#### Verify on Mantlescan (required for the Project Deployment Award)

If you didn't pass `--verify` to forge, verify after deploy:

```bash
forge verify-contract <DEPLOYED_ADDRESS> contracts/src/AgentIdentity.sol:AgentIdentity \
  --chain mantle --watch --etherscan-api-key $MANTLESCAN_API_KEY
```

## Going live

| Surface | Service | Notes |
|---|---|---|
| Web dashboard | **Vercel** (free) | Connect repo, set `MANTLE_RPC_URL`, `VENICE_API_KEY`, `NEXT_PUBLIC_TELEGRAM_URL`. |
| Indexer + detector + bot | **Railway** ($5/mo) | One Node container, `Procfile`-style: `worker: tsx src/runner.ts`. |
| Postgres | **Neon** (free) | Copy `DATABASE_URL`. |
| Telegram bot | @BotFather | Create bot, add to channel as admin, paste token + channel id. |
| Contract | Mantle mainnet | Fund a burner with ~$2 of $MNT, run `forge script script/Deploy.s.sol --broadcast --verify`. |
| Domain | optional | CNAME `theread.xyz` to Vercel. |

End-to-end deploy time when DBs are pre-provisioned: ~30 minutes.

## Telegram bot commands

- `/latest` — last 5 alerts
- `/wallet 0x…` — labels + 30d stats for any wallet
- `/agent` — ERC-8004 identity status

## Stack

| Component | Choice | Why |
|---|---|---|
| Chain | **Mantle** | Hackathon target. Deep DeFi (mETH/USDY/fBTC), cheap gas, ERC-8004 home. |
| Inference | **Z.ai GLM-4.7 Flash** via **Venice** | Open weights, E2EE inference. ~11× cheaper than GLM-5.1, output is plenty good for our short structured prompts. |
| Wallet intel | **Nansen** | Best smart-money labels in the space. Every wallet on the dashboard deep-links to Nansen for copy-trade research. |
| Social signal | **Elfa AI** | Mindshare + trending tokens — the "what's social Twitter saying" layer over our on-chain feed. |
| Identity | **ERC-8004** | Agent identity NFT + attestation log. Verifiable provenance. |
| Prices | **Coingecko** | USD denomination for transfers + 24h change. |
| Web | Next.js 15 + Geist + Tailwind | Server components, edge cache, sparklines drawn in SVG. |
| Indexer | viem + Drizzle ORM + postgres-js | Single-process or sharded. |
| Contracts | Foundry + Solidity 0.8.24 | 10 tests passing including 256-case fuzz. |

## Repo layout

```
src/
├── lib/        # env, chain client, tokens, ABIs, formatting
├── db/         # Drizzle schema + client
├── indexer/    # block/transfer ingest, prices, label heuristics
├── detector/   # price/volume/whale detectors + cooldown
├── narrator/   # Venice (Z.ai GLM-5.1) + template fallback
├── bot/        # Telegram + Discord delivery
├── scripts/    # backfill, seed, label, register-agent
└── runner.ts   # single-process orchestrator

web/            # Next.js 15 dashboard (separate Vercel deploy)
contracts/      # AgentIdentity.sol + foundry tests + deploy script
```

## Why this wins

- **Track 2 fit.** It's literally an "AI-powered on-chain analysis & monitoring tool" with verifiable, on-chain Alpha. Every requirement met.
- **Mantle ecosystem contribution.** A real product on Mantle that anyone can subscribe to via Telegram. The contract lives on Mantle.
- **Verifiable AI.** Most AI x crypto demos screenshot good calls and bury bad ones. ERC-8004 attestations make the agent's record un-revisable.
- **Judge-aligned stack.** Mantle (chain), Z.ai (model), Nansen (intel), Elfa (social). Four judges' surfaces, integrated in the product itself.
- **Live demo.** No DB required — the dashboard renders against Mantle RPC on every load. Demos itself during the live-stream finale.

## License

MIT
