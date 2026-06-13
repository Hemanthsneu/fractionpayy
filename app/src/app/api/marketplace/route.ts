/** Marketplace listings with live oracle prices from the RWAMarket. */
import { NextResponse } from "next/server";
import { createPublicClient, http, formatUnits } from "viem";
import { arcTestnet } from "@/lib/chains";
import { deployments } from "@/lib/deployments";
import { marketAbi } from "@/lib/contracts";

export const dynamic = "force-dynamic";

const pub = createPublicClient({ chain: arcTestnet, transport: http() });

export async function GET() {
  const dep = deployments.arcTestnet;
  const listed = dep.rwas.filter((r) => r.listed);
  try {
    const assets = await Promise.all(
      listed.map(async (r) => {
        const price = (await pub
          .readContract({ address: dep.market, abi: marketAbi, functionName: "pricePerShareUsd", args: [r.token] })
          .catch(() => BigInt(0))) as bigint;
        return {
          symbol: r.symbol,
          name: r.name,
          token: r.token,
          assetType: r.assetType,
          emoji: r.emoji,
          yieldPct: r.yieldBps / 100,
          pricePerShareUsd: Number(formatUnits(price, 6)),
        };
      })
    );
    return NextResponse.json({ market: dep.market, assets });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
