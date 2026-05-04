/**
 * Static fixture used when DEMO_MODE=1 or the DB is unreachable. Lets the
 * dashboard render a realistic preview without a live indexer behind it.
 * Numbers are illustrative — production values come from the indexer.
 */
import type { DashboardStats } from "./queries";

export const demoStats: DashboardStats = {
  alertsToday: 47,
  alertsAttested: 47,
  walletsTracked: 18_421,
  transfers24hUsd: 184_300_000,
  topToken: { symbol: "0xcda86a272531e8640cd7f1a92c01839911b90bb0", volumeUsd: 71_200_000 },
  indexerLag: 4,
  lastBlockTs: new Date(Date.now() - 4_000),
};

export const demoAlerts = [
  {
    id: 47,
    kind: "price_spike",
    severity: 4,
    token: "MNT",
    headline: "MNT up +5.2% in 15m",
    narrative:
      "MNT is up 5.2% in the last 15 minutes on roughly $6M of buying — Bybit's hot wallet led with $4M and a single whale added $2.1M.",
    txUrl: "https://mantlescan.xyz/tx/0x9f3e",
    attestationTx: "0xa7b2c9d1e5f80123",
    alertHash: "0x4f9c2e7a8d6b1c3f9e2a4d6b8c1f3e5a7c9b2d4f6a8c0e2d4f6a8c0e2d4f6a8c",
    createdAt: new Date(Date.now() - 2 * 60 * 1000),
  },
  {
    id: 46,
    kind: "whale_move",
    severity: 4,
    token: "USDe",
    headline: "$8.3M USDe withdrawal",
    narrative:
      "$8.3M USDe just left a Bybit hot wallet for a fresh address with no prior on-chain history.",
    txUrl: "https://mantlescan.xyz/tx/0x8e2d",
    attestationTx: "0xb8c3d2e6f70234ab",
    alertHash: "0x5f0d3e8b9c7a2d4f0e3b5d7a9c2e4f6a8c0e2d4f6a8c0e2d4f6a8c0e2d4f6a8c",
    createdAt: new Date(Date.now() - 11 * 60 * 1000),
  },
  {
    id: 45,
    kind: "volume_spike",
    severity: 3,
    token: "mETH",
    headline: "mETH volume 4x normal",
    narrative:
      "mETH volume just hit $14M in the last hour, about 4x the 24h average. Most of it was a single unlabeled wallet ($5.5M) plus an arb bot rotating in.",
    txUrl: null,
    attestationTx: "0xc9d4e3f8a01345bc",
    alertHash: "0x6a1e4f9c0d8b3e5f1d4c6e8b0d3e5f7a9c1e3d5f7a9c1e3d5f7a9c1e3d5f7a9c",
    createdAt: new Date(Date.now() - 27 * 60 * 1000),
  },
  {
    id: 44,
    kind: "price_spike",
    severity: 2,
    token: "USDY",
    headline: "USDY −1.4% in 30m",
    narrative: "USDY slipped 1.4% over the last 30 minutes after a whale unloaded $3M.",
    txUrl: "https://mantlescan.xyz/tx/0x7d1c",
    attestationTx: "0xd0e5f4a91b2456cd",
    alertHash: "0x7b2f5a0d1e9c4f6a2e5d7f9b1e4f6a8c0e2d4f6a8c0e2d4f6a8c0e2d4f6a8c0e",
    createdAt: new Date(Date.now() - 41 * 60 * 1000),
  },
  {
    id: 43,
    kind: "whale_move",
    severity: 3,
    token: "fBTC",
    headline: "$2.1M fBTC bridged in",
    narrative:
      "$2.1M fBTC just moved from the Mantle native bridge to a wallet labeled MEV Bot, which immediately split it across three Agni V3 pools.",
    txUrl: "https://mantlescan.xyz/tx/0x6c0b",
    attestationTx: "0xe1f6a5b02c3567de",
    alertHash: "0x8c3e6b1f2a0d5e7b3f6e8a0c2f5a7c9e1f3b5d7a9c1e3d5f7a9c1e3d5f7a9c1e",
    createdAt: new Date(Date.now() - 58 * 60 * 1000),
  },
  {
    id: 42,
    kind: "volume_spike",
    severity: 2,
    token: "USDC",
    headline: "USDC volume 2.5x normal",
    narrative:
      "USDC moved $22M in the last hour, about 2.5x normal. The biggest sender was Mantle Treasury rebalancing into Ondo's USDY for treasuries yield.",
    txUrl: null,
    attestationTx: null,
    alertHash: "0x9d4f7c2a3b1e6f8d4a7c9e1f3b5d7a9c1e3d5f7a9c1e3d5f7a9c1e3d5f7a9c1e",
    createdAt: new Date(Date.now() - 73 * 60 * 1000),
  },
];

export const demoWallets = [
  {
    address: "0xf89d7b9c864f589bbf53a82105107622b35eaa40",
    volumeUsd: 84_200_000,
    txCount: 1_847,
    lastSeen: new Date(Date.now() - 30_000),
    labels: ["Bybit Hot Wallet"],
  },
  {
    address: "0x95fc37a27a2f68e3a647cdc081f0a89bb47c3012",
    volumeUsd: 47_300_000,
    txCount: 982,
    lastSeen: new Date(Date.now() - 110_000),
    labels: ["Mantle Native Bridge"],
  },
  {
    address: "0xeaee7ee68874218c3558b40063c42b82d3e7232a",
    volumeUsd: 38_900_000,
    txCount: 4_217,
    lastSeen: new Date(Date.now() - 12_000),
    labels: ["Merchant Moe Router"],
  },
  {
    address: "0xa9b72ccc9968afec98a96239b5aa48d828e8d827",
    volumeUsd: 28_500_000,
    txCount: 156,
    lastSeen: new Date(Date.now() - 280_000),
    labels: ["Mantle Treasury"],
  },
  {
    address: "0xd3ad1b1bbf3ad6ad04a3eafd0b03ed6a05f73ce4",
    volumeUsd: 19_400_000,
    txCount: 712,
    lastSeen: new Date(Date.now() - 95_000),
    labels: ["OKX Hot Wallet"],
  },
  {
    address: "0x319b69888b0d11cec22caa5034e25fffbdc88421",
    volumeUsd: 14_700_000,
    txCount: 2_891,
    lastSeen: new Date(Date.now() - 7_000),
    labels: ["Agni V3 Router"],
  },
  {
    address: "0x4ec6831e5a1c1d39c08c4f3aff3c2902b0b5ad8e",
    volumeUsd: 8_300_000,
    txCount: 47,
    lastSeen: new Date(Date.now() - 180_000),
    labels: ["Whale"],
  },
  {
    address: "0x2c1d81f3d5b88e6af4e0f59c3e6c8f1a02db4717",
    volumeUsd: 6_200_000,
    txCount: 1_244,
    lastSeen: new Date(Date.now() - 22_000),
    labels: ["MEV Bot"],
  },
  {
    address: "0x7f83a4b2c91d6e5f48a7e0d3c92b1f8e4d6c5a01",
    volumeUsd: 4_900_000,
    txCount: 89,
    lastSeen: new Date(Date.now() - 540_000),
    labels: [],
  },
  {
    address: "0x3e1f7d2a8b4c9e5f0a6d1b3c7e9f2a4d8b6c0e3f",
    volumeUsd: 3_200_000,
    txCount: 634,
    lastSeen: new Date(Date.now() - 60_000),
    labels: ["MEV Bot"],
  },
];

export const demoTokenVolumes = [
  { token: "0xcda86a272531e8640cd7f1a92c01839911b90bb0", volumeUsd: 71_200_000, transfers: 4_812 },
  { token: "0x5d3a1ff2b6bab83b63cd9ad0787074081a52ef34", volumeUsd: 38_400_000, transfers: 2_104 },
  { token: "0x09bc4e0d864854c6afb6eb9a9cdf58ac190d0df9", volumeUsd: 27_900_000, transfers: 6_581 },
  { token: "0x78c1b0c915c4faa5fffa6cabf0219da63d7f4cb8", volumeUsd: 21_300_000, transfers: 3_412 },
  { token: "0x5be26527e817998a7206475496fde1e68957c5a6", volumeUsd: 12_800_000, transfers: 89 },
  { token: "0xc96de26018a54d51c097160568752c4e3bd6c364", volumeUsd: 7_400_000, transfers: 154 },
  { token: "0x201eba5cc46d216ce6dc03f6a759e8e766e956ae", volumeUsd: 5_300_000, transfers: 421 },
];

export const isDemoMode = process.env.DEMO_MODE === "1";
