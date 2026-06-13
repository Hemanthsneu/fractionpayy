/**
 * Invest USDC into a listed RWA — buys fractional shares at the live oracle
 * price (USDC -> treasury, shares minted to the investor). Server-side via the
 * demo wallet so it works on any device; builds the user's portfolio.
 */
import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http, parseUnits, isAddress, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet } from "@/lib/chains";
import { deployments } from "@/lib/deployments";
import { marketAbi, erc20Abi } from "@/lib/contracts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const pub = createPublicClient({ chain: arcTestnet, transport: http() });

export async function POST(request: NextRequest) {
  const { token, usdcAmount } = await request.json().catch(() => ({}));
  if (!isAddress(token)) return NextResponse.json({ error: "bad token" }, { status: 400 });

  const pk = process.env.BUYER_PRIVATE_KEY;
  if (!pk) return NextResponse.json({ error: "wallet not configured" }, { status: 500 });

  const dep = deployments.arcTestnet;
  const amt = parseUnits(String(usdcAmount ?? 1000), 6);
  const account = privateKeyToAccount(pk as `0x${string}`);
  const wallet = createWalletClient({ account, chain: arcTestnet, transport: http() });

  try {
    // Approve the market to pull USDC, then invest.
    const approveTx = await wallet.writeContract({
      address: dep.usdc,
      abi: erc20Abi,
      functionName: "approve",
      args: [dep.market, amt],
    });
    await pub.waitForTransactionReceipt({ hash: approveTx });

    const tx = await wallet.writeContract({
      address: dep.market,
      abi: marketAbi,
      functionName: "invest",
      args: [token as Address, amt],
    });
    const receipt = await pub.waitForTransactionReceipt({ hash: tx });

    return NextResponse.json({ ok: true, tx, blockNumber: Number(receipt.blockNumber), token, usdcAmount: Number(usdcAmount ?? 1000) });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message.split("\n")[0] }, { status: 502 });
  }
}
