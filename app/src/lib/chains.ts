import { defineChain } from "viem";
import { baseSepolia, mainnet, sepolia } from "viem/chains";

/** Circle's Arc testnet — USDC is the NATIVE gas token (18 decimals as native). */
export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.arc.network"],
      webSocket: ["wss://rpc.testnet.arc.network"],
    },
  },
  testnet: true,
});

// Ethereum Sepolia — where the ERC-8004 agent + reputation loop live (real Ethereum).
export const ethereumSepolia = defineChain({
  ...sepolia,
  rpcUrls: {
    default: { http: ["https://ethereum-sepolia-rpc.publicnode.com"] },
  },
});

export { baseSepolia, mainnet, sepolia };
