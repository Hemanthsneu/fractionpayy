/**
 * One-time: create + seed the writable BigQuery leaderboard table from the live
 * mainnet ranking. Run after granting the service account "BigQuery Data Editor".
 */
import { NextResponse } from "next/server";
import { seedLeaderboard } from "@/lib/bigquery";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST() {
  try {
    const r = await seedLeaderboard();
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 502 });
  }
}
