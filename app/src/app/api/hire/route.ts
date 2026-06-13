/**
 * Hire the top-ranked optimizer agent and pay it via x402.
 *
 * Server-side x402 client: signs a gasless USDC authorization (EIP-3009)
 * with the buyer wallet, the facilitator settles on Base Sepolia, and the
 * agent's paywalled /api/optimize returns the liquidation plan.
 * Returns the plan PLUS the real x402 settlement tx hash for the receipt.
 */
import { NextRequest, NextResponse } from "next/server";
import { privateKeyToAccount } from "viem/accounts";
import { wrapFetchWithPayment } from "x402-fetch";

export const dynamic = "force-dynamic";

function selfUrl(request: NextRequest, path: string): string {
  // Local dev: use the incoming origin. Prod: the deployed URL.
  const origin =
    process.env.NODE_ENV === "development"
      ? request.nextUrl.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin);
  return `${origin}${path}`;
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const pk = process.env.BUYER_PRIVATE_KEY;
  if (!pk) {
    return NextResponse.json({ error: "BUYER_PRIVATE_KEY not configured" }, { status: 500 });
  }
  const account = privateKeyToAccount(pk as `0x${string}`);
  const fetchWithPayment = wrapFetchWithPayment(fetch, account);

  const res = await fetchWithPayment(selfUrl(request, "/api/optimize"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: "agent call failed", detail: data }, { status: 502 });
  }

  // The facilitator returns the on-chain settlement details in this header.
  let settlement: { transaction?: string; network?: string; payer?: string } = {};
  const header = res.headers.get("x-payment-response");
  if (header) {
    try {
      settlement = JSON.parse(Buffer.from(header, "base64").toString("utf8"));
    } catch {
      /* non-fatal */
    }
  }

  return NextResponse.json({
    ...data,
    x402: {
      paid: true,
      feeUsd: 0.001,
      network: settlement.network ?? "base-sepolia",
      settlementTx: settlement.transaction ?? null,
      payer: settlement.payer ?? account.address,
    },
  });
}
