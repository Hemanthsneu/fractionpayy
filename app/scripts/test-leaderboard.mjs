// Verify the GCP service account works end-to-end: run the ERC-8004
// reputation leaderboard (Query 3) through @google-cloud/bigquery.
// Run from app/: node scripts/test-leaderboard.mjs
import { BigQuery } from "@google-cloud/bigquery";
import { fileURLToPath } from "node:url";

const bq = new BigQuery({
  projectId: "fractionpay",
  keyFilename: fileURLToPath(new URL("../../gcp-service-account.json", import.meta.url)),
});

// CRITICAL: the partition filter on DATE(block_timestamp) is what keeps
// bytes-scanned small. Without it this query scans the ENTIRE multi-TB
// logs table and burns the whole free monthly quota in one run.
// ERC-8004 went live Jan 2026, so nothing exists before that.
const QUERY = `
WITH feedback AS (
  SELECT
    topics[SAFE_OFFSET(1)] AS agent_id_hex,
    topics[SAFE_OFFSET(2)] AS client_hex,
    block_timestamp
  FROM \`bigquery-public-data.crypto_ethereum.logs\`
  WHERE DATE(block_timestamp) >= '2026-01-01'
    AND address = '0x8004baa17c55a88189ae136b182e5fda19de9b63'
    AND topics[SAFE_OFFSET(0)] = '0x6a4a61743519c9d648a14e6493f47dbe3ff1aa29e7785c96c8326a205e58febc'
)
SELECT
  agent_id_hex,
  COUNT(*) AS feedback_count,
  COUNT(DISTINCT client_hex) AS unique_clients,
  MAX(block_timestamp) AS last_feedback
FROM feedback
GROUP BY agent_id_hex
ORDER BY feedback_count DESC
LIMIT 10`;

// Dry run first: free, doesn't consume quota, reports bytes that WOULD scan.
const [dryJob] = await bq.createQueryJob({ query: QUERY, dryRun: true });
const gb = Number(dryJob.metadata.statistics.totalBytesProcessed) / 1e9;
console.log(`Dry run: query would scan ${gb.toFixed(2)} GB`);
if (process.argv.includes("--dry-run")) process.exit(0);

const [rows] = await bq.query({ query: QUERY });
console.log(`✅ Service account works. Top ${rows.length} agents by feedback:\n`);
for (const r of rows) {
  const agentId = BigInt(r.agent_id_hex).toString();
  console.log(
    `agent #${agentId.padEnd(8)} feedback=${String(r.feedback_count).padEnd(6)} clients=${r.unique_clients}  last=${r.last_feedback?.value ?? r.last_feedback}`
  );
}
