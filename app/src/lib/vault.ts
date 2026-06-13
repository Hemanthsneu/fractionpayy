import { createPublicClient, http, formatUnits } from "viem";
import { arcTestnet } from "./chains";
import { deployments } from "./deployments";
import { vaultAbi } from "./contracts";

const pub = createPublicClient({ chain: arcTestnet, transport: http() });

export interface VaultStats {
  tvlUsd: number;
  pricePerShare: number;
  lpYieldPct: number;
  totalFeesUsd: number;
  totalYieldPreservedUsd: number;
  feeBps: number;
}

/** Live vault economics from Arc — the business model on-chain. */
export async function getVaultStats(): Promise<VaultStats> {
  const v = deployments.arcTestnet.vault;
  const [nav, pps, fees, yieldPreserved, feeBps] = await Promise.all([
    pub.readContract({ address: v, abi: vaultAbi, functionName: "totalAssets" }),
    pub.readContract({ address: v, abi: vaultAbi, functionName: "pricePerShare" }),
    pub.readContract({ address: v, abi: vaultAbi, functionName: "totalFeesUsd" }),
    pub.readContract({ address: v, abi: vaultAbi, functionName: "totalYieldPreservedUsd" }),
    pub.readContract({ address: v, abi: vaultAbi, functionName: "feeBps" }),
  ]);
  const pricePerShare = Number(formatUnits(pps, 6));
  return {
    tvlUsd: Number(formatUnits(nav, 6)),
    pricePerShare,
    lpYieldPct: (pricePerShare - 1) * 100,
    totalFeesUsd: Number(formatUnits(fees, 6)),
    totalYieldPreservedUsd: Number(formatUnits(yieldPreserved, 6)),
    feeBps: Number(feeBps),
  };
}
