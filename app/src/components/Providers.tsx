"use client";

import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { arcTestnet, baseSepolia, mainnet } from "@/lib/chains";

// CORS-friendly RPCs (browser-callable — llamarpc/cloudflare block preflight).
const RPC = {
  arc: "https://rpc.testnet.arc.network",
  baseSepolia: "https://base-sepolia-rpc.publicnode.com",
  mainnet: "https://ethereum-rpc.publicnode.com",
};

const wagmiConfig = createConfig({
  chains: [arcTestnet, baseSepolia, mainnet],
  multiInjectedProviderDiscovery: false,
  transports: {
    [arcTestnet.id]: http(RPC.arc),
    [baseSepolia.id]: http(RPC.baseSepolia),
    [mainnet.id]: http(RPC.mainnet),
  },
});

// Tell Dynamic about our chains (otherwise it warns + can't switch to Arc).
const evmNetworks = [
  {
    blockExplorerUrls: ["https://explorer.testnet.arc.network"],
    chainId: 5042002,
    networkId: 5042002,
    chainName: "Arc Testnet",
    name: "Arc Testnet",
    nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
    rpcUrls: [RPC.arc],
    iconUrls: ["https://app.dynamic.xyz/assets/networks/ethereum.svg"],
  },
  {
    blockExplorerUrls: ["https://sepolia.basescan.org"],
    chainId: 84532,
    networkId: 84532,
    chainName: "Base Sepolia",
    name: "Base Sepolia",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: [RPC.baseSepolia],
    iconUrls: ["https://app.dynamic.xyz/assets/networks/base.svg"],
  },
];

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID ?? "",
        walletConnectors: [EthereumWalletConnectors],
        overrides: { evmNetworks },
      }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <DynamicWagmiConnector>{children}</DynamicWagmiConnector>
        </QueryClientProvider>
      </WagmiProvider>
    </DynamicContextProvider>
  );
}
