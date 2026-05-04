/** Centralized external links — keeps URL formats in one place. */

export const mantlescanAddress = (addr: string) =>
  `https://mantlescan.xyz/address/${addr}`;
export const mantlescanTx = (tx: string) => `https://mantlescan.xyz/tx/${tx}`;

/** Nansen profiler. Works as a deep-link without an API key — the user
 *  hits Nansen's UI directly. If Nansen doesn't have indexed data for a
 *  Mantle address, their app handles the empty state. */
export const nansenProfiler = (addr: string) =>
  `https://app.nansen.ai/profiler/${addr}`;

export const nansenSmartMoney = "https://app.nansen.ai/smart-money";

export const veniceModel = "https://venice.ai/chat?model=zai-org-glm-5-1";
export const zai = "https://z.ai";
export const elfaApi = "https://www.elfa.ai/api";
export const erc8004 = "https://eips.ethereum.org/EIPS/eip-8004";
export const mantle = "https://mantle.xyz";
