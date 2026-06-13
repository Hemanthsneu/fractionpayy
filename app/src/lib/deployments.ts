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
  fractionPay: Address;
  usdc: Address;
  rwas: RwaInfo[];
}

const ZERO = "0x0000000000000000000000000000000000000000" as Address;

export const deployments: Record<string, Deployment> = {
  arcTestnet: {
    chainId: 5042002,
    fractionPay: "0x4920038eA3f321B2C501a1e4f152a3Cc13f420C4",
    usdc: "0x28bc27eE659F96109c2f58be64E9b584e534F629",
    rwas: [
      {
        symbol: "TBILL",
        name: "US T-Bill 3M 2026",
        token: "0xc156eEe9e4887DFf0dEFbF7bF03888c1240cF63F",
        feed: "0xf2CDA2580D7472138E721F40880551909514c42E",
        yieldBps: 450,
        emoji: "🏛️",
      },
      {
        symbol: "XAUM",
        name: "Tokenized Gold oz",
        token: "0x91Cb5809968B494c85356Fa23288a35Fe2a5DD63",
        feed: "0x288c3361d370Fc5e21919A105eA12b4Db0d2BC86",
        yieldBps: 0,
        emoji: "🥇",
      },
      {
        symbol: "MREIT",
        name: "Manhattan REIT Share",
        token: "0xD7feacD181d3F9c5BaB05b4BF66b8E864cF29a02",
        feed: "0xF6926fBce62A62B25EE2C9c8B34a3970FD48132e",
        yieldBps: 610,
        emoji: "🏙️",
      },
    ],
  },
  baseSepolia: {
    chainId: 84532,
    fractionPay: ZERO, // TODO: fill after deploy
    usdc: ZERO,
    rwas: [],
  },
};

/** Demo wallets (testnet burners — public addresses only). */
export const demoWallets = {
  // Demo buyer = the presenter's MetaMask (holds the tokenized RWA portfolio on Arc).
  buyer: "0xce22e02b82a20bE9c59dc11161778469B2Bf7C26" as Address,
  coffeeshop: "0x24f098DD3a7260DCcfdD9D74714289B9131DD745" as Address,
  supplier: "0xfb98F38B40751422356f5eEa6bBB663831fd5E04" as Address,
  agent: "0x69C4b79F998e92267f116f12A3D9764ac77b8F30" as Address,
};
