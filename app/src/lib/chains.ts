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

/** The chain where FractionPay settlement runs for the demo. */
export const settlementChain = arcTestnet;
/** The chain where x402 agent micropayments run (facilitator support). */
export const agentPaymentChain = baseSepolia;
/** The chain where the ERC-8004 agent identity + reputation feedback live. */
export const agentReputationChain = ethereumSepolia;
