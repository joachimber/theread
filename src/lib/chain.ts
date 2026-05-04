import { defineChain, createPublicClient, http, webSocket, fallback } from "viem";
import { env } from "./env.js";

export const mantle = defineChain({
  id: env.MANTLE_CHAIN_ID,
  name: "Mantle",
  nativeCurrency: { name: "Mantle", symbol: "MNT", decimals: 18 },
  rpcUrls: {
    default: { http: [env.MANTLE_RPC_URL], webSocket: [env.MANTLE_WS_URL] },
  },
  blockExplorers: {
    default: { name: "MantleScan", url: "https://mantlescan.xyz" },
  },
});

export const publicClient = createPublicClient({
  chain: mantle,
  transport: fallback([http(env.MANTLE_RPC_URL), webSocket(env.MANTLE_WS_URL)]),
  batch: { multicall: true },
});

export type PublicClient = typeof publicClient;
