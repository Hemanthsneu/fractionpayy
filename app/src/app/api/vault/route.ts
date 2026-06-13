/**
 * Live vault economics — the business model, on-chain.
 * TVL (NAV), LP share price, lifetime protocol fees, and the annualized yield
 * the optimizer agent has preserved for users.
 */
import { NextResponse } from "next/server";
import { createPublicClient, http, formatUnits } from "viem";
import { arcTestnet } from "@/lib/chains";
import { deployments } from "@/lib/deployments";
import { vaultAbi } from "@/lib/contracts";

export const dynamic = "force-dynamic";

const pub = createPublicClient({ chain: arcTestnet, transport: http() });

export async function GET() {
  const v = deployments.arcTestnet.vault;
  try {
    const [nav, pps, fees, yieldPreserved, feeBps] = await Promise.all([
      pub.readContract({ address: v, abi: vaultAbi, functionName: "totalAssets" }),
      pub.readContract({ address: v, abi: vaultAbi, functionName: "pricePerShare" }),
      pub.readContract({ address: v, abi: vaultAbi, functionName: "totalFeesUsd" }),
      pub.readContract({ address: v, abi: vaultAbi, functionName: "totalYieldPreservedUsd" }),
      pub.readContract({ address: v, abi: vaultAbi, functionName: "feeBps" }),
    ]);
    return NextResponse.json({
      vault: v,
      tvlUsd: Number(formatUnits(nav, 6)),
      pricePerShare: Number(formatUnits(pps, 6)),
      lpYieldPct: (Number(formatUnits(pps, 6)) - 1) * 100, // appreciation since $1 inception
      totalFeesUsd: Number(formatUnits(fees, 6)),
      totalYieldPreservedUsd: Number(formatUnits(yieldPreserved, 6)),
      feeBps: Number(feeBps),
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
