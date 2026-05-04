import { parseAbi } from "viem";

export const erc20Abi = parseAbi([
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function name() view returns (string)",
]);

/** Uniswap V2 / Merchant Moe v1 style swap event. */
export const v2PairAbi = parseAbi([
  "event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)",
  "event Sync(uint112 reserve0, uint112 reserve1)",
  "function token0() view returns (address)",
  "function token1() view returns (address)",
]);

/** Uniswap V3 / Agni style swap. */
export const v3PoolAbi = parseAbi([
  "event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)",
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function fee() view returns (uint24)",
]);

/** Minimal ERC-8004 agent identity ABI for logging on-chain attestations. */
export const agentIdentityAbi = parseAbi([
  "function recordAlert(uint256 tokenId, bytes32 alertHash, string calldata uri) external",
  "function mint(address to, string calldata metadataURI) external returns (uint256)",
  "function attestationsOf(uint256 tokenId) external view returns (uint256)",
  "event AlertRecorded(uint256 indexed tokenId, bytes32 indexed alertHash, string uri, uint256 timestamp)",
]);
