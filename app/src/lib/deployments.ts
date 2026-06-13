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
  /** Tokenized real-estate property with stablecoin dividends. */
  property: Address;
  rwas: RwaInfo[];
}

export const deployments: Record<string, Deployment> = {
  arcTestnet: {
    chainId: 5042002,
    vault: "0xA7623b54108F29e99aCC492aD3B7f935379c4c25",
    usdc: "0xea4b39ee4814A1952973FDA51BDdb96c8c3A6557",
    eurc: "0x8351Cf27B35152119E585Cc21dBB1D3aA602ff47",
    property: "0x4B6Fd6F27aDF844a563C5b046a9A44210Ce28c8C",
    rwas: [
      {
        symbol: "TBILL",
        name: "US T-Bill 3M",
        token: "0x6F612bc5Eb27120E069321F3B97817C17ed3A104",
        feed: "0xe3d7642aA1e8D8260D0CE6B030a07109Acd84E60",
        yieldBps: 450,
        emoji: "🏛️",
      },
      {
        symbol: "XAUM",
        name: "Tokenized Gold oz",
        token: "0xC01c6e3Aa27C13BBCA25c7c7245cba31f890Bf11",
        feed: "0xeCCCfBDcA982768418E86C304FEa1D67eA2e3F35",
        yieldBps: 0,
        emoji: "🥇",
      },
      {
        symbol: "MREIT",
        name: "Manhattan REIT Share",
        token: "0xc70d16f13140f36fCa9a7Fd071c4aEa75f134Cc8",
        feed: "0x87D3A68264dF227b2407dB5F9828936D33a105Ad",
        yieldBps: 610,
        emoji: "🏙️",
      },
      {
        symbol: "MNHTN",
        name: "Manhattan Office Tower",
        token: "0x4B6Fd6F27aDF844a563C5b046a9A44210Ce28c8C",
        feed: "0xf09E391493642E9B0E9B6cA2899370af99620741",
        yieldBps: 600,
        emoji: "🏢",
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
