import type { Address } from "viem";

/**
 * Deployed contract addresses per chain.
 * Filled in by `forge script script/Deploy.s.sol` output — update after deploy.
 */
export interface RwaInfo {
  symbol: string;
  name: string;
  token: Address;
  feed: Address;
  yieldBps: number;
  emoji: string;
}

export interface Deployment {
  chainId: number;
  /** FractionPay v2 — ERC-4626 yield-bearing vault + payment engine. */
  vault: Address;
  usdc: Address;
  eurc: Address;
  rwas: RwaInfo[];
}

export const deployments: Record<string, Deployment> = {
  arcTestnet: {
    chainId: 5042002,
    vault: "0x81474BC97a075e47a718d901a11116C1e3CA4fA4",
    usdc: "0xD85f3530aab65E0DB7EdE2e8d1E701dDbF049D20",
    eurc: "0xD8194136c2139c2fCA137C4361F04a4B880905e9",
    rwas: [
      {
        symbol: "TBILL",
        name: "US T-Bill 3M",
        token: "0xa8028dAE4D439c9324Dc28725D9063C2fBb74df4",
        feed: "0xFA4679f91a4b27bEB348b2df97ED3F17A331bFB6",
        yieldBps: 450,
        emoji: "🏛️",
      },
      {
        symbol: "XAUM",
        name: "Tokenized Gold oz",
        token: "0xf299113F88349db5959366e704C77ab263b1816D",
        feed: "0x8cECAC513639df4c100eAF4B40C5e3d56F6a4dd5",
        yieldBps: 0,
        emoji: "🥇",
      },
      {
        symbol: "MREIT",
        name: "Manhattan REIT Share",
        token: "0x1b52d497908dfC908525f1027D306883DC3415c5",
        feed: "0x7EbcBE526b06C589F3b6187c8881B0358E49F94c",
        yieldBps: 610,
        emoji: "🏙️",
      },
    ],
  },
};

/** Demo wallets (testnet burners — public addresses only). */
export const demoWallets = {
  // Portfolio + settlement wallet (holds RWA + Arc gas; key in server env).
  // FractionPay settles from this wallet server-side, so the demo works on any
  // device without the visitor's wallet needing the RWA or the Arc network.
  buyer: "0x45763cE2De66E3261278228aA998AAC917FA14E1" as Address,
  coffeeshop: "0x24f098DD3a7260DCcfdD9D74714289B9131DD745" as Address,
  supplier: "0xfb98F38B40751422356f5eEa6bBB663831fd5E04" as Address,
  agent: "0x69C4b79F998e92267f116f12A3D9764ac77b8F30" as Address,
};
