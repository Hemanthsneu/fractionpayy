import { defineChain } from "viem";
import { baseSepolia, mainnet } from "viem/chains";

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

export { baseSepolia, mainnet };

/** The chain where FractionPay settlement runs for the demo. */
export const settlementChain = arcTestnet;
/** The chain where x402 agent micropayments run (facilitator support). */
export const agentPaymentChain = baseSepolia;
