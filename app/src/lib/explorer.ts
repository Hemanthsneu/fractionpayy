/** Block-explorer URL builders, so every on-chain artifact is demonstrable. */
export const EXPLORERS = {
  arc: "https://testnet.arcscan.app",
  ethereumSepolia: "https://sepolia.etherscan.io",
  baseSepolia: "https://sepolia.basescan.org",
  mainnet: "https://etherscan.io",
} as const;

export type ExplorerChain = keyof typeof EXPLORERS;

export function txUrl(chain: ExplorerChain, hash: string): string {
  return `${EXPLORERS[chain]}/tx/${hash}`;
}

export function addressUrl(chain: ExplorerChain, addr: string): string {
  return `${EXPLORERS[chain]}/address/${addr}`;
}

/** 0x1234…abcd */
export function shortHash(h: string, lead = 6, tail = 4): string {
  return h.length > lead + tail ? `${h.slice(0, lead)}…${h.slice(-tail)}` : h;
}
