/**
 * Agent Marketplace leaderboard — Ethereum MAINNET ERC-8004 reputation data
 * ranked via Google BigQuery.
 *
 * Architecture (quota-safe): the expensive 226 GB scan runs OFFLINE via
 * `scripts/refresh-leaderboard.mjs` which writes src/data/leaderboard.json.
 * This route serves that cache instantly and never live-queries during a demo.
 * Set ?live=1 to force a live BigQuery run (costs ~$1.40).
 */
import { NextRequest, NextResponse } from "next/server";
import leaderboardCache from "@/data/leaderboard.json";

export const dynamic = "force-dynamic";

interface AgentRow {
  agentId: string;
  feedbackCount: number;
  uniqueClients: number;
  lastFeedback: string;
  reputationScore: number;
}

function score(feedbackCount: number, uniqueClients: number): number {
  // Volume weighted by client diversity: catches self-dealing inflation
  // (e.g. mainnet agent #13445: 83 feedback from only 19 clients).
  const diversity = uniqueClients / Math.max(feedbackCount, 1);
  return Math.round(feedbackCount * diversity * 10 * 100) / 100;
}

export async function GET(request: NextRequest) {
  const cache = leaderboardCache as { generatedAt: string; agents: AgentRow[] };
  const live = request.nextUrl.searchParams.get("live") === "1";

  if (cache && !live) {
    return NextResponse.json({
      source: "bigquery-cache",
      dataset: "bigquery-public-data.crypto_ethereum (Ethereum mainnet)",
      registry: "ERC-8004 Reputation Registry 0x8004BAa1...9b63",
      ...cache,
      ourAgent: {
        agentId: process.env.FRACTIONPAY_AGENT_ID ?? "pending-registration",
        ensName: "optimizer.fractionpay.eth",
        endpoint: "/api/optimize",
        network: "base-sepolia (live writes) + mainnet leaderboard",
      },
    });
  }

  // Live path — dev/refresh only.
  const { BigQuery } = await import("@google-cloud/bigquery");
  const bq = new BigQuery({ projectId: process.env.GCP_PROJECT_ID });
  const [rows] = await bq.query({
    query: `
      WITH feedback AS (
        SELECT topics[SAFE_OFFSET(1)] AS agent_id_hex,
               topics[SAFE_OFFSET(2)] AS client_hex,
               block_timestamp
        FROM \`bigquery-public-data.crypto_ethereum.logs\`
        WHERE DATE(block_timestamp) >= '2026-01-01'
          AND address = '0x8004baa17c55a88189ae136b182e5fda19de9b63'
          AND topics[SAFE_OFFSET(0)] = '0x6a4a61743519c9d648a14e6493f47dbe3ff1aa29e7785c96c8326a205e58febc'
      )
      SELECT agent_id_hex,
             COUNT(*) AS feedback_count,
             COUNT(DISTINCT client_hex) AS unique_clients,
             MAX(block_timestamp) AS last_feedback
      FROM feedback GROUP BY agent_id_hex
      ORDER BY feedback_count DESC LIMIT 50`,
  });

  const agents: AgentRow[] = rows.map(
    (r: {
      agent_id_hex: string;
      feedback_count: number;
      unique_clients: number;
      last_feedback: { value: string };
    }) => ({
      agentId: BigInt(r.agent_id_hex).toString(),
      feedbackCount: Number(r.feedback_count),
      uniqueClients: Number(r.unique_clients),
      lastFeedback: r.last_feedback?.value ?? "",
      reputationScore: score(Number(r.feedback_count), Number(r.unique_clients)),
    })
  );
  agents.sort((a, b) => b.reputationScore - a.reputationScore);

  return NextResponse.json({
    source: "bigquery-live",
    generatedAt: new Date().toISOString(),
    agents,
  });
}
