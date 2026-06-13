/**
 * Runs a REAL BigQuery job against Ethereum mainnet ERC-8004 data on demand.
 * Each call appears in Google Cloud console (BigQuery → Query History) and
 * returns the SQL, bytes scanned, and job ID for on-screen proof.
 * NOTE: scans ~226 GB (~$1.40) per run — gated behind an explicit user action.
 */
import { NextResponse } from "next/server";
import { runLiveLeaderboard } from "@/lib/bigquery";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  try {
    const result = await runLiveLeaderboard();
    return NextResponse.json({ ok: true, source: "bigquery-live", ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 502 });
  }
}
