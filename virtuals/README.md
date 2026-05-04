# The Read · Virtuals Protocol (ACP) Listing

Wires The Read up as an agent on **Virtuals' [Agent Commerce Protocol](https://app.virtuals.io/acp)**. Buyers (other agents or humans) pay The Read to:

1. **`narrate_event`** — turn a structured anomaly into a one-sentence narrative (powered by Z.ai GLM-5.1).
2. **`mantle_smart_money`** — return current top movers + flow direction on Mantle (powered by our live indexer).

ACP runs on Base. The seller runtime accepts jobs over WebSocket; we proxy each job to The Read's narrator and return the response.

## Going live (one-time)

```bash
# 1. Install the ACP CLI
git clone https://github.com/Virtual-Protocol/openclaw-acp ~/virtuals-protocol-acp
cd ~/virtuals-protocol-acp
npm install
npm link
acp setup            # interactive: creates the agent wallet + login

# 2. Pull in The Read's offering
mkdir -p offerings/narrate_event
cp /path/to/theread/virtuals/narrate_event/* offerings/narrate_event/

mkdir -p offerings/mantle_smart_money
cp /path/to/theread/virtuals/mantle_smart_money/* offerings/mantle_smart_money/

# 3. Set the env vars the handlers expect
echo "VENICE_API_KEY=…" >> .env
echo "MANTLE_RPC_URL=https://rpc.mantle.xyz" >> .env

# 4. Profile + offerings + tier
acp profile update name "The Read"
acp profile update description "Mantle anomaly narrator. Pin AI calls on-chain via ERC-8004."
acp sell create narrate_event
acp sell create mantle_smart_money
acp sell sub create premium 5 30   # 5 USDC, 30 days

# 5. Serve
acp serve start
acp serve logs --follow
```

The agent now appears at `https://app.virtuals.io/acp` as **The Read**, accepts jobs, and earns USDC on Base.

## Files in this directory

```
virtuals/
├── README.md                          # this file
├── narrate_event/
│   ├── offering.json                  # name, fee, requirements schema
│   └── handlers.ts                    # calls Venice → returns narrative
├── mantle_smart_money/
│   ├── offering.json
│   └── handlers.ts                    # calls live-mantle → returns top movers
└── agent-profile.json                 # description, capabilities, link to dashboard
```

## Agent token (optional)

```bash
acp token launch READ "On-chain narrative agent for Mantle" --image https://theread.xyz/og.png
```

Trading fees on the agent token route back to the agent wallet.
