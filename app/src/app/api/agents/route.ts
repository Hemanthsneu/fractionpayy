/**
 * Agent leaderboard. Prefers the LIVE writable BigQuery table
 * (fractionpay.reputation.leaderboard) — the one that re-ranks when on-chain
 * feedback posts. Falls back to the cached mainnet snapshot if the table
 * isn't seeded yet (before /api/agents/setup is run).
 */
import { NextResponse } from "next/server";
import leaderboardCache from "@/data/leaderboard.json";
import { readLeaderboard } from "@/lib/bigquery";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const board = await readLeaderboard();
    if (board.length > 0) {
      return NextResponse.json({
        source: "bigquery-table-live",
        table: "fractionpay.reputation.leaderboard",
        registry: "ERC-8004 (Ethereum) ranked via Google BigQuery",
        agents: board,
      });
    }
  } catch {
    // table not seeded yet / no write perms — fall through to cache.
  }
  return NextResponse.json({
    source: "bigquery-cache",
    dataset: "bigquery-public-data.crypto_ethereum (Ethereum mainnet)",
    ...(leaderboardCache as object),
  });
}
