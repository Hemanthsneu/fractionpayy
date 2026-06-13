/**
 * Close the ERC-8004 reputation loop: after a successful payment, the buyer
 * (the agent's CLIENT) posts feedback to the Reputation Registry on Base
 * Sepolia. Fire-and-forget from the receipt screen.
 */
import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, http, publicActions } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "@/lib/chains";
import { erc8004ReputationAbi, ERC8004 } from "@/lib/contracts";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { score = 100, paymentTx = "" } = await request.json().catch(() => ({}));

  const pk = process.env.BUYER_PRIVATE_KEY;
  const agentId = process.env.FRACTIONPAY_AGENT_ID;
  if (!pk || !agentId) {
    return NextResponse.json({ error: "feedback signer not configured" }, { status: 500 });
  }

  const account = privateKeyToAccount(pk as `0x${string}`);
  const client = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(),
  }).extend(publicActions);

  try {
    const hash = await client.writeContract({
      address: ERC8004.reputation.baseSepolia as `0x${string}`,
      abi: erc8004ReputationAbi,
      functionName: "giveFeedback",
      args: [
        BigInt(agentId),
        BigInt(Math.min(Math.max(Number(score), 0), 100)),
        0,
        "fractionpay-payment",
        paymentTx ? `tx:${paymentTx}` : "",
        "/api/optimize",
        "",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      ],
    });
    return NextResponse.json({ ok: true, feedbackTx: hash, agentId });
  } catch (e) {
    // Non-fatal by design — the payment already succeeded.
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 200 });
  }
}
