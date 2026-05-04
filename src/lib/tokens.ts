import type { Address } from "viem";

export interface Token {
  symbol: string;
  address: Address;
  decimals: number;
  /** Loose category for narrator context. */
  kind: "stable" | "lst" | "btc" | "rwa" | "native" | "other";
  /** Optional human-readable note shown in narratives. */
  note?: string;
  /** Whether this token's flows feed the anomaly detector. */
  watch: boolean;
  /** Coingecko id used by the price oracle. */
  coingeckoId?: string;
}

/**
 * Mantle token registry — verify each address against mantlescan.xyz before
 * deploying to production. Addresses are sourced from official docs.
 */
export const TOKENS: Record<string, Token> = {
  WMNT: {
    symbol: "WMNT",
    address: "0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8",
    decimals: 18,
    kind: "native",
    watch: true,
    coingeckoId: "mantle",
    note: "Wrapped MNT (Mantle's native token)",
  },
  METH: {
    symbol: "mETH",
    address: "0xcDA86A272531e8640cD7F1a92c01839911B90bb0",
    decimals: 18,
    kind: "lst",
    watch: true,
    coingeckoId: "mantle-staked-ether",
    note: "Mantle's liquid-staked ETH — anchor of the LST flywheel",
  },
  USDC: {
    symbol: "USDC",
    address: "0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9",
    decimals: 6,
    kind: "stable",
    watch: true,
    coingeckoId: "usd-coin",
  },
  USDT: {
    symbol: "USDT",
    address: "0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE",
    decimals: 6,
    kind: "stable",
    watch: true,
    coingeckoId: "tether",
  },
  USDe: {
    symbol: "USDe",
    address: "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34",
    decimals: 18,
    kind: "stable",
    watch: true,
    coingeckoId: "ethena-usde",
    note: "Ethena synthetic dollar — large delta-neutral flows",
  },
  USDY: {
    symbol: "USDY",
    address: "0x5bE26527e817998A7206475496fDE1E68957c5A6",
    decimals: 18,
    kind: "rwa",
    watch: true,
    coingeckoId: "ondo-us-dollar-yield",
    note: "Ondo's tokenized US Treasuries — institutional flow proxy",
  },
  WETH: {
    symbol: "WETH",
    address: "0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111",
    decimals: 18,
    kind: "other",
    watch: true,
    coingeckoId: "ethereum",
  },
  FBTC: {
    symbol: "FBTC",
    address: "0xC96dE26018A54D51c097160568752c4E3BD6C364",
    decimals: 8,
    kind: "btc",
    watch: true,
    coingeckoId: "ignition-fbtc",
    note: "Ignition's wrapped BTC on Mantle",
  },
  WBTC: {
    symbol: "WBTC",
    address: "0xCAbAE6f6Ea1ecaB08Ad02fE02ce9A44F09aebfA2",
    decimals: 8,
    kind: "btc",
    watch: true,
    coingeckoId: "wrapped-bitcoin",
  },
};

export const TOKENS_BY_ADDRESS: Map<string, Token> = new Map(
  Object.values(TOKENS).map((t) => [t.address.toLowerCase(), t]),
);

export function findToken(address: string): Token | undefined {
  return TOKENS_BY_ADDRESS.get(address.toLowerCase());
}

export const WATCHED_ADDRESSES: Address[] = Object.values(TOKENS)
  .filter((t) => t.watch)
  .map((t) => t.address);

export const COINGECKO_IDS: string[] = Object.values(TOKENS)
  .filter((t) => t.coingeckoId)
  .map((t) => t.coingeckoId!);

/** Map coingecko id back to token symbol. */
export const COINGECKO_TO_SYMBOL: Record<string, string> = Object.fromEntries(
  Object.values(TOKENS)
    .filter((t) => t.coingeckoId)
    .map((t) => [t.coingeckoId!, t.symbol]),
);
