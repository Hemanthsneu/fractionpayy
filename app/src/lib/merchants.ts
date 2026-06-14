import { createPublicClient, http, type Address } from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";
import { demoWallets } from "./deployments";

export interface Merchant {
  ensName: string;
  displayName: string;
  address: Address;
  acceptedTokens: string[];
  chain: string;
  emoji: string;
  /** "ens" when resolved live from mainnet ENS, "registry" for built-in fallback. */
  source: "ens" | "registry";
}


const FALLBACK: Record<string, Omit<Merchant, "source">> = {
  "coffeeshop.fractionpay.eth": {
    ensName: "coffeeshop.fractionpay.eth",
    displayName: "Brooklyn Coffee Co.",
    address: demoWallets.coffeeshop,
    acceptedTokens: ["USDC"],
    chain: "arc-testnet",
    emoji: "☕",
  },
  "supplier.fractionpay.eth": {
    ensName: "supplier.fractionpay.eth",
    displayName: "Atlas Supply GmbH",
    address: demoWallets.supplier,
    acceptedTokens: ["USDC", "EURC"],
    chain: "arc-testnet",
    emoji: "🏢",
  },
  "charity.fractionpay.eth": {
    ensName: "charity.fractionpay.eth",
    displayName: "Clean Water Fund",
    address: demoWallets.supplier,
    acceptedTokens: ["USDC"],
    chain: "arc-testnet",
    emoji: "💝",
  },
};

const ensClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.ETH_MAINNET_RPC_URL || "https://ethereum-rpc.publicnode.com"),
});


export async function resolveMerchant(rawName: string): Promise<Merchant | null> {
  const name = decodeURIComponent(rawName).toLowerCase();

  try {
    const ensName = normalize(name);
    const [address, displayName, tokens, chain] = await Promise.all([
      ensClient.getEnsAddress({ name: ensName }),
      ensClient.getEnsText({ name: ensName, key: "fractionpay.name" }),
      ensClient.getEnsText({ name: ensName, key: "fractionpay.tokens" }),
      ensClient.getEnsText({ name: ensName, key: "fractionpay.chain" }),
    ]);
    if (address) {
      const fb = FALLBACK[name];
      return {
        ensName,
        displayName: displayName ?? fb?.displayName ?? ensName,
        address,
        acceptedTokens: tokens ? tokens.split(",") : (fb?.acceptedTokens ?? ["USDC"]),
        chain: chain ?? fb?.chain ?? "arc-testnet",
        emoji: fb?.emoji ?? "🏪",
        source: "ens",
      };
    }
  } catch {
    // fall through to registry
  }

  const fb = FALLBACK[name];
  return fb ? { ...fb, source: "registry" } : null;
}

export const demoMerchants = Object.values(FALLBACK);
