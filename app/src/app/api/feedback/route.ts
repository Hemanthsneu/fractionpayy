/**
 * Close the ERC-8004 reputation loop — automatically, driven by the agent's
 * measured performance (not a manual thumbs-up):
 *   1. score how well the agent optimized this payment (performanceScore)
 *   2. post that score on-chain as feedback to the Reputation Registry on ETHEREUM
 *   3. update our agent in the live BigQuery leaderboard — a HIGH score counts
 *      as a satisfied new client (diversity ↑ → climbs); a LOW score is a repeat
 *      complaint (diversity ↓ → stalls), so rank tracks real performance
 *   4. return the re-ranked leaderboard so the frontend updates instantly
 *
 * Modes:
 *   { plan, amountUsd, paymentTx }  → score a real payment's optimization
 *   { simulate: true }              → run the agent on a sample payment now
 *   { score }                       → explicit score (back-compat)
 */
import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, http, publicActions } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ethereumSepolia } from "@/lib/chains";
import { erc8004ReputationAbi, ERC8004 } from "@/lib/contracts";
import { recordOurFeedback } from "@/lib/bigquery";
import { planLiquidation, performanceScore, type LiquidationPlan } from "@/lib/optimizer";
import { getPortfolio } from "@/lib/portfolio";
import { demoWallets } from "@/lib/deployments";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// A high score = the agent optimized well = a satisfied (new) client.
const GOOD = 85;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  let { score } = body as { score?: number };
  const { paymentTx = "", simulate = false } = body as { paymentTx?: string; simulate?: boolean };
  let plan: LiquidationPlan | undefined = body.plan;
  let amountUsd: number | undefined = body.amountUsd;

  // ── derive a performance score from a real or simulated agent task ──
  if (simulate && !plan) {
    try {
      const positions = await getPortfolio(demoWallets.buyer);
      // vary the payment so each run is a distinct optimization task
      amountUsd = [4, 6, 12, 18, 27][Math.floor(Math.random() * 5)];
      plan = planLiquidation(positions, amountUsd);
    } catch {
      /* fall through to explicit/default score */
    }
  }
  if (plan && typeof amountUsd === "number") {
    score = performanceScore(plan, amountUsd);
  }
  if (typeof score !== "number") score = 100;
  score = Math.min(Math.max(Math.round(score), 0), 100);

  // performance decides whether this counts as a happy new client (diversity)
  const newClient = typeof body.newClient === "boolean" ? body.newClient : score >= GOOD;

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
          BigInt(score),
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
    const leaderboard = await recordOurFeedback(newClient);
    return NextResponse.json({ ok: true, score, newClient, plan, amountUsd, feedbackTx, chainError, leaderboard });
  } catch (e) {
    return NextResponse.json(
      { ok: false, score, plan, amountUsd, feedbackTx, chainError, error: (e as Error).message },
      { status: 200 }
    );
  }
}
