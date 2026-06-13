/**
 * Close the ERC-8004 reputation loop after a payment:
 *   1. post feedback on-chain to the Reputation Registry on ETHEREUM (Sepolia)
 *   2. update our agent's score in the live BigQuery leaderboard table
 *   3. return the re-ranked leaderboard so the frontend updates instantly
 * This is the feedback → reputation → BigQuery re-rank loop, on Ethereum.
 */
import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, http, publicActions } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ethereumSepolia } from "@/lib/chains";
import { erc8004ReputationAbi, ERC8004 } from "@/lib/contracts";
import { recordOurFeedback } from "@/lib/bigquery";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const { score = 100, paymentTx = "", newClient = true } = await request
    .json()
    .catch(() => ({}));

  // 1. on-chain feedback on Ethereum (best-effort; needs a registered ETH agent + gas)
  let feedbackTx: string | null = null;
  let chainError: string | null = null;
  const pk = process.env.BUYER_PRIVATE_KEY;
  const ethAgentId = process.env.FRACTIONPAY_AGENT_ID_ETH;
  if (pk && ethAgentId) {
    try {
      const account = privateKeyToAccount(pk as `0x${string}`);
      const client = createWalletClient({ account, chain: ethereumSepolia, transport: http() }).extend(
        publicActions
      );
      feedbackTx = await client.writeContract({
        address: ERC8004.reputation.ethereumSepolia as `0x${string}`,
        abi: erc8004ReputationAbi,
        functionName: "giveFeedback",
        args: [
          BigInt(ethAgentId),
          BigInt(Math.min(Math.max(Number(score), 0), 100)),
          0,
          "fractionpay-payment",
          paymentTx ? `tx:${paymentTx}` : "",
          "/api/optimize",
          "",
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        ],
      });
    } catch (e) {
      chainError = (e as Error).message.split("\n")[0];
    }
  }

  // 2 + 3. re-rank in BigQuery and return the new leaderboard (the visible loop)
  try {
    const leaderboard = await recordOurFeedback(Boolean(newClient));
    return NextResponse.json({ ok: true, feedbackTx, chainError, leaderboard });
  } catch (e) {
    return NextResponse.json(
      { ok: false, feedbackTx, chainError, error: (e as Error).message },
      { status: 200 }
    );
  }
}
