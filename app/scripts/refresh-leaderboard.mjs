/**
 * Refresh the agent-marketplace leaderboard cache from Ethereum mainnet
 * ERC-8004 data via BigQuery. Writes src/data/leaderboard.json.
 *
 * Cost: ~$1.40 per run (226 GB scan). Run sparingly — the app serves the cache.
 *   cd app && node scripts/refresh-leaderboard.mjs
 */
import { BigQuery } from "@google-cloud/bigquery";
import { fileURLToPath } from "node:url";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const keyFilename = fileURLToPath(new URL("../../gcp-service-account.json", import.meta.url));
const bq = new BigQuery({ projectId: "fractionpay", keyFilename });

const QUERY = `
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
ORDER BY feedback_count DESC LIMIT 50`;

const [dry] = await bq.createQueryJob({ query: QUERY, dryRun: true });
console.log(`Scanning ${(Number(dry.metadata.statistics.totalBytesProcessed) / 1e9).toFixed(1)} GB...`);

const [rows] = await bq.query({ query: QUERY });

const score = (fb, clients) => Math.round(fb * (clients / Math.max(fb, 1)) * 10 * 100) / 100;

const agents = rows
  .map((r) => ({
    agentId: BigInt(r.agent_id_hex).toString(),
    feedbackCount: Number(r.feedback_count),
    uniqueClients: Number(r.unique_clients),
    lastFeedback: r.last_feedback?.value ?? "",
    reputationScore: score(Number(r.feedback_count), Number(r.unique_clients)),
  }))
  .sort((a, b) => b.reputationScore - a.reputationScore);

const out = { generatedAt: new Date().toISOString(), agents };
const dest = fileURLToPath(new URL("../src/data/leaderboard.json", import.meta.url));
await mkdir(path.dirname(dest), { recursive: true });
await writeFile(dest, JSON.stringify(out, null, 2));
console.log(`✅ Wrote ${agents.length} agents to src/data/leaderboard.json`);
console.log(`Top 3:`, agents.slice(0, 3).map((a) => `#${a.agentId} (score ${a.reputationScore})`).join(", "));
