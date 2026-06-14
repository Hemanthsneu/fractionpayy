/**
 * Real BigQuery job over Ethereum mainnet ERC-8004 Identity Registry data:
 * agent registrations per week + total. Appears in the Google Cloud console
 * (BigQuery → Query History). Gated behind an explicit user action (scans data).
 */
import { NextResponse } from "next/server";
import { runRegistrationStats } from "@/lib/bigquery";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  try {
    const result = await runRegistrationStats();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 502 });
  }
}
