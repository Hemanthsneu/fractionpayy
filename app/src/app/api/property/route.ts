/**
 * Tokenized property + stablecoin dividends.
 * GET: property metadata, lifetime dividends, holder's claimable amount.
 * POST {action:"distribute"}: issuer pays quarterly rent as USDC dividends.
 * POST {action:"claim"}: holder withdraws their pro-rata dividends.
 * Server-side (uses the demo wallet, which is both issuer and holder).
 */
import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, formatUnits, parseUnits, isAddress, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet } from "@/lib/chains";
import { deployments, demoWallets } from "@/lib/deployments";
import { propertyTokenAbi, erc20Abi } from "@/lib/contracts";

export const dynamic = "force-dynamic";

const pub = createPublicClient({ chain: arcTestnet, transport: http() });
const PROP = deployments.arcTestnet.property;

async function readState(holder: Address = demoWallets.buyer) {
  const [valuation, yieldBps, supply, totalDist, distCount, lastAt, bal, claimable] =
    await Promise.all([
      pub.readContract({ address: PROP, abi: propertyTokenAbi, functionName: "valuationUsd" }),
      pub.readContract({ address: PROP, abi: propertyTokenAbi, functionName: "annualYieldBps" }),
      pub.readContract({ address: PROP, abi: propertyTokenAbi, functionName: "totalSupply" }),
      pub.readContract({ address: PROP, abi: propertyTokenAbi, functionName: "totalDividendsDistributed" }),
      pub.readContract({ address: PROP, abi: propertyTokenAbi, functionName: "distributionCount" }),
      pub.readContract({ address: PROP, abi: propertyTokenAbi, functionName: "lastDistributionAt" }),
      pub.readContract({ address: PROP, abi: propertyTokenAbi, functionName: "balanceOf", args: [holder] }),
      pub.readContract({ address: PROP, abi: propertyTokenAbi, functionName: "withdrawableDividendOf", args: [holder] }),
    ]);
  return {
    property: PROP,
    name: "Manhattan Office Tower",
    location: "350 5th Ave, New York, NY",
    valuationUsd: Number(formatUnits(valuation, 6)),
    annualYieldPct: Number(yieldBps) / 100,
    totalShares: Number(formatUnits(supply, 18)),
    yourShares: Number(formatUnits(bal, 18)),
    yourOwnershipPct: Number(supply) > 0 ? (Number(bal) / Number(supply)) * 100 : 0,
    totalDividendsDistributed: Number(formatUnits(totalDist, 6)),
    distributionCount: Number(distCount),
    lastDistributionAt: Number(lastAt),
    claimableUsd: Number(formatUnits(claimable, 6)),
  };
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("address");
  const holder = raw && isAddress(raw) ? (raw as Address) : demoWallets.buyer;
  try {
    return NextResponse.json(await readState(holder));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const { action, amountUsd } = await request.json().catch(() => ({}));
  const pk = process.env.BUYER_PRIVATE_KEY;
  if (!pk) return NextResponse.json({ error: "wallet not configured" }, { status: 500 });

  const account = privateKeyToAccount(pk as `0x${string}`);
  const wallet = createWalletClient({ account, chain: arcTestnet, transport: http() });

  try {
    let tx: `0x${string}`;
    if (action === "distribute") {
      // Quarterly rent for the issued float: shares * $1,000 * 6% / 4 ≈ $1,500.
      const amt = parseUnits(String(amountUsd ?? 1500), 6);
      // distributeDividends pulls USDC via transferFrom → must approve first.
      const approveTx = await wallet.writeContract({
        address: deployments.arcTestnet.usdc,
        abi: erc20Abi,
        functionName: "approve",
        args: [PROP, amt],
      });
      await pub.waitForTransactionReceipt({ hash: approveTx });
      tx = await wallet.writeContract({
        address: PROP,
        abi: propertyTokenAbi,
        functionName: "distributeDividends",
        args: [amt],
      });
    } else if (action === "claim") {
      tx = await wallet.writeContract({
        address: PROP,
        abi: propertyTokenAbi,
        functionName: "claimDividend",
      });
    } else {
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
    await pub.waitForTransactionReceipt({ hash: tx });
    return NextResponse.json({ ok: true, tx, action, state: await readState() });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message.split("\n")[0] }, { status: 502 });
  }
}
