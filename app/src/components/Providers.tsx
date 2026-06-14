"use client";

import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { arcTestnet, baseSepolia, mainnet, ethereumSepolia } from "@/lib/chains";

// CORS-friendly RPCs (browser-callable — llamarpc/cloudflare block preflight).
const RPC = {
  arc: "https://rpc.testnet.arc.network",
  baseSepolia: "https://base-sepolia-rpc.publicnode.com",
  mainnet: "https://ethereum-rpc.publicnode.com",
  ethereumSepolia: "https://ethereum-sepolia-rpc.publicnode.com",
};

const wagmiConfig = createConfig({
  chains: [arcTestnet, baseSepolia, mainnet, ethereumSepolia],
  multiInjectedProviderDiscovery: false,
  transports: {
    [arcTestnet.id]: http(RPC.arc),
    [baseSepolia.id]: http(RPC.baseSepolia),
    [mainnet.id]: http(RPC.mainnet),
    [ethereumSepolia.id]: http(RPC.ethereumSepolia),
  },
});

// Tell Dynamic about EVERY chain in the wagmi config — otherwise it warns and
// can't render/switch chains (the "Chain (id: 1) is present in Wagmi but not in
// Dynamic" console error). Each entry here must mirror a wagmi chain.
const evmNetworks = [
  {
    blockExplorerUrls: ["https://testnet.arcscan.app"],
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
  {
    blockExplorerUrls: ["https://sepolia.etherscan.io"],
    chainId: 11155111,
    networkId: 11155111,
    chainName: "Ethereum Sepolia",
    name: "Ethereum Sepolia",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: [RPC.ethereumSepolia],
    iconUrls: ["https://app.dynamic.xyz/assets/networks/ethereum.svg"],
  },
  {
    blockExplorerUrls: ["https://etherscan.io"],
    chainId: 1,
    networkId: 1,
    chainName: "Ethereum",
    name: "Ethereum Mainnet",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: [RPC.mainnet],
    iconUrls: ["https://app.dynamic.xyz/assets/networks/ethereum.svg"],
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
