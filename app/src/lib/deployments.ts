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
  assetType: string; // real-estate | treasury | commodity | bond | fund
  listed?: boolean; // available to buy in the marketplace
}

export interface Deployment {
  chainId: number;
  /** FractionPay v2 — ERC-4626 yield-bearing vault + payment engine. */
  vault: Address;
  usdc: Address;
  eurc: Address;
  /** Tokenized real-estate property with stablecoin dividends. */
  property: Address;
  /** Primary market: invest USDC -> RWA shares. */
  market: Address;
  rwas: RwaInfo[];
}

export const deployments: Record<string, Deployment> = {
  arcTestnet: {
    chainId: 5042002,
    vault: "0x3FbE9FA34858Af481625849144fA14726E25670f",
    usdc: "0x9EEDcFcE92Dfa9E3CC8D3D530EEA6e49F6FB1BDC",
    eurc: "0x2cE98E09447ABf7c7F971a3FC76DE59354c8e8cC",
    property: "0x805F070884DF5d83B669EbDceA2C16A68954976f",
    market: "0xB3624f299fb080c36c9535CA1C270c08b5d95390",
    rwas: [
      {
        symbol: "TBILL",
        name: "US T-Bill 3M",
        token: "0x11F14c3105659e99138385470Ea884dbD802E68a",
        feed: "0xC4a98aa21B4970C590A0C9FF700546d6F82702Fb",
        yieldBps: 450,
        emoji: "🏛️",
        assetType: "treasury",
        listed: true,
      },
      {
        symbol: "XAUM",
        name: "Tokenized Gold",
        token: "0x7B71200f8494F923972977620C61537Fa30eC484",
        feed: "0x52Dd81A1F4B10d2B4F6a8c7C5eE195C71379C01D",
        yieldBps: 0,
        emoji: "🥇",
        assetType: "commodity",
        listed: true,
      },
      {
        symbol: "MREIT",
        name: "Brooklyn Warehouse REIT",
        token: "0xa112A86390A3FdE652b264812B3Ee679a74578e6",
        feed: "0x52ce5E74C215270c13886c402eA8aC28D4a795c4",
        yieldBps: 610,
        emoji: "🏙️",
        assetType: "real-estate",
        listed: true,
      },
      {
        symbol: "AAPL30",
        name: "Apple 2030 Corp Bond",
        token: "0x863DbFc2bd2Cea6F1b23A069147743166265678E",
        feed: "0x52A2BC6F077f4e33CF0C9807ecBac935e67dCbBb",
        yieldBps: 520,
        emoji: "📜",
        assetType: "bond",
        listed: true,
      },
      {
        symbol: "MMF",
        name: "Money Market Fund",
        token: "0xcA09A4da3e1b5759203011095Ba06C96D80E0d69",
        feed: "0x0936A0928D2Fbb02303951E2dBD95be9B565960D",
        yieldBps: 480,
        emoji: "💵",
        assetType: "fund",
        listed: true,
      },
      {
        symbol: "MNHTN",
        name: "Manhattan Office Tower",
        token: "0x805F070884DF5d83B669EbDceA2C16A68954976f",
        feed: "0xc66e90B05B04f7CA660f8FC24f415702E7F7f99C",
        yieldBps: 600,
        emoji: "🏢",
        assetType: "real-estate",
        listed: false, // featured separately (has dividends)
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
