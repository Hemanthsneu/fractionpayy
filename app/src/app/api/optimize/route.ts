/**
 * The FractionPay optimizer AGENT — an x402-paywalled service.
 *
 * Calling POST /api/optimize without payment returns HTTP 402 with payment
 * requirements. x402-fetch clients pay $0.001 USDC (Base Sepolia) to the
 * agent's wallet, retry with the payment header, and get the liquidation plan.
 * Settlement happens via the public x402 facilitator only AFTER a successful
 * response (withX402 semantics).
 *
 * This endpoint is what the agent's ERC-8004 agent card points to.
 */
import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "x402-next";
import { planLiquidation, type Position } from "@/lib/optimizer";

// The agent's own wallet — this address IS optimizer.fractionpay.eth (ENS, mainnet)
// and ERC-8004 agent #6553 on Ethereum. x402 fees for each optimization settle here
// (on Base Sepolia, where the x402 facilitator runs). One agent, one address.
const AGENT_WALLET = "0x69C4b79F998e92267f116f12A3D9764ac77b8F30" as `0x${string}`;

const handler = async (request: NextRequest): Promise<NextResponse> => {
  let body: { amountUsd?: number; positions?: Position[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const amountUsd = Number(body.amountUsd);
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    return NextResponse.json({ error: "amountUsd must be > 0" }, { status: 400 });
  }
  if (!Array.isArray(body.positions) || body.positions.length === 0) {
    return NextResponse.json({ error: "positions[] required" }, { status: 400 });
  }

  try {
    const plan = planLiquidation(body.positions, amountUsd);
    return NextResponse.json({
      agent: "optimizer.fractionpay.eth",
      agentWallet: AGENT_WALLET,
      erc8004AgentId: process.env.FRACTIONPAY_AGENT_ID_ETH ?? "6553",
      erc8004Chain: "ethereum-sepolia",
      plan,
      paidVia: "x402",
      pricing: { price: "$0.001", network: "base-sepolia" },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 422 });
  }
};

// Demo-mode escape hatch (fallback plan): X402_DISABLED=1 serves the plan
// unpaywalled so a facilitator outage can never kill the live demo.
export const POST =
  process.env.X402_DISABLED === "1"
    ? handler
    : withX402(handler, AGENT_WALLET, {
        price: process.env.X402_PRICE_USD ? `$${process.env.X402_PRICE_USD}` : "$0.001",
        network: "base-sepolia",
        config: {
          description:
            "FractionPay optimizer agent: returns the optimal RWA liquidation plan for a payment.",
        },
      });
