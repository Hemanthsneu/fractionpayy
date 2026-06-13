/**
 * Server-side settlement on Arc — the reliable demo path.
 *
 * FractionPay executes the RWA->USDC settlement on the buyer's behalf using
 * the portfolio wallet (the same flow proven on-chain via cast). This makes
 * the payment work on ANY device without requiring the visitor's wallet to
 * hold the RWA or switch to the custom Arc network. The connected wallet +
 * World ID remain identity/verification layers.
 */
import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http, parseUnits, isAddress, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet } from "@/lib/chains";
import { deployments } from "@/lib/deployments";
import { fractionPayAbi, erc20Abi } from "@/lib/contracts";

export const dynamic = "force-dynamic";

const pub = createPublicClient({ chain: arcTestnet, transport: http() });

export async function POST(request: NextRequest) {
  const { symbol, sellAmount, merchant, amountUsd } = await request.json().catch(() => ({}));

  const pk = process.env.BUYER_PRIVATE_KEY;
  if (!pk) return NextResponse.json({ error: "settlement wallet not configured" }, { status: 500 });
  if (!isAddress(merchant)) return NextResponse.json({ error: "bad merchant address" }, { status: 400 });

  const dep = deployments.arcTestnet;
  const rwa = dep.rwas.find((r) => r.symbol === symbol);
  if (!rwa) return NextResponse.json({ error: `unknown RWA ${symbol}` }, { status: 400 });

  const sellWei = parseUnits(Number(sellAmount).toFixed(18), 18);
  const minOut = parseUnits((Number(amountUsd) * 0.98).toFixed(6), 6); // 2% slippage guard

  const account = privateKeyToAccount(pk as `0x${string}`);
  const wallet = createWalletClient({ account, chain: arcTestnet, transport: http() });

  try {
    const approveTx = await wallet.writeContract({
      address: rwa.token,
      abi: erc20Abi,
      functionName: "approve",
      args: [dep.fractionPay, sellWei],
    });
    await pub.waitForTransactionReceipt({ hash: approveTx });

    const tx = await wallet.writeContract({
      address: dep.fractionPay,
      abi: fractionPayAbi,
      functionName: "payWithRWA",
      args: [merchant as Address, rwa.token, sellWei, minOut],
    });
    const receipt = await pub.waitForTransactionReceipt({ hash: tx });

    return NextResponse.json({
      ok: true,
      settlementTx: tx,
      blockNumber: Number(receipt.blockNumber),
      merchant,
      symbol,
      sellAmount,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message.split("\n")[0] }, { status: 502 });
  }
}
