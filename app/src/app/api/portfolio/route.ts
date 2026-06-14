import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, formatUnits, formatEther, isAddress, type Address } from "viem";
import { getPortfolio } from "@/lib/portfolio";
import { deployments, demoWallets } from "@/lib/deployments";
import { erc20Abi } from "@/lib/contracts";
import { arcTestnet } from "@/lib/chains";

export const dynamic = "force-dynamic";

const pub = createPublicClient({ chain: arcTestnet, transport: http() });

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("address") ?? demoWallets.buyer;
  if (!isAddress(raw)) {
    return NextResponse.json({ error: "invalid address" }, { status: 400 });
  }
  const addr = raw as Address;
  const [positions, usdcRaw, nativeRaw] = await Promise.all([
    getPortfolio(addr),
    pub.readContract({ address: deployments.arcTestnet.usdc, abi: erc20Abi, functionName: "balanceOf", args: [addr] }).catch(() => BigInt(0)),
    pub.getBalance({ address: addr }).catch(() => BigInt(0)),
  ]);
  const usdcBalance = Number(formatUnits(usdcRaw as bigint, 6));
  const nativeGasUsdc = Number(formatEther(nativeRaw as bigint));
  // RWA value + spendable USDC cash = net worth on Arc.
  const totalUsd = positions.reduce((s, p) => s + p.valueUsd, 0) + usdcBalance;
  return NextResponse.json({ address: raw, totalUsd, positions, usdcBalance, nativeGasUsdc });
}
