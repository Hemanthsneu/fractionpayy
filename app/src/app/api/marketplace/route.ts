/**
 * Marketplace listings — read live from the on-chain RWAMarket so EVERY asset
 * ever tokenized (including ones just created in the admin panel) shows up,
 * not just a hardcoded list. Source of truth = the RWAMarket.assets[] array.
 */
import { NextResponse } from "next/server";
import { createPublicClient, http, formatUnits } from "viem";
import { arcTestnet } from "@/lib/chains";
import { deployments } from "@/lib/deployments";
import { marketAbi, erc20Abi } from "@/lib/contracts";

export const dynamic = "force-dynamic";

const pub = createPublicClient({ chain: arcTestnet, transport: http() });

const EMOJI: Record<string, string> = {
  "real-estate": "🏙️",
  treasury: "🏛️",
  commodity: "🥇",
  bond: "📜",
  fund: "💵",
  other: "🪙",
};

export async function GET() {
  const dep = deployments.arcTestnet;
  // Known assets from config keep their curated emoji/symbol.
  const known = new Map(
    dep.rwas.map((r) => [r.token.toLowerCase(), { emoji: r.emoji, symbol: r.symbol }])
  );

  try {
    const count = Number(
      (await pub.readContract({
        address: dep.market,
        abi: marketAbi,
        functionName: "assetCount",
      })) as bigint
    );

    const tokens = (await Promise.all(
      Array.from({ length: count }, (_, i) =>
        pub.readContract({ address: dep.market, abi: marketAbi, functionName: "assets", args: [BigInt(i)] })
      )
    )) as `0x${string}`[];

    const assets = (
      await Promise.all(
        tokens.map(async (token) => {
          const [, apyBps, assetType, name, active] = (await pub.readContract({
            address: dep.market,
            abi: marketAbi,
            functionName: "listings",
            args: [token],
          })) as [string, number, string, string, boolean];
          if (!active) return null;

          const price = (await pub
            .readContract({ address: dep.market, abi: marketAbi, functionName: "pricePerShareUsd", args: [token] })
            .catch(() => BigInt(0))) as bigint;

          const k = known.get(token.toLowerCase());
          const symbol =
            k?.symbol ??
            ((await pub
              .readContract({ address: token, abi: erc20Abi, functionName: "symbol" })
              .catch(() => "RWA")) as string);

          return {
            symbol,
            name,
            token,
            assetType,
            emoji: k?.emoji ?? EMOJI[assetType] ?? EMOJI.other,
            yieldPct: Number(apyBps) / 100,
            pricePerShareUsd: Number(formatUnits(price, 6)),
          };
        })
      )
    ).filter(Boolean);

    return NextResponse.json({ market: dep.market, assets });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message.split("\n")[0] }, { status: 502 });
  }
}
