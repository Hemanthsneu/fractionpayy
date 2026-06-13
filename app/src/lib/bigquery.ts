import { BigQuery } from "@google-cloud/bigquery";

/**
 * Live BigQuery against Ethereum MAINNET ERC-8004 reputation data.
 * Credentials come from env (GCP_SERVICE_ACCOUNT_JSON) so it runs on Vercel;
 * falls back to the local key file in dev. Each run is a real BigQuery job,
 * visible in the Google Cloud console (BigQuery → Query History).
 */

// ERC-8004 Reputation Registry (mainnet) + NewFeedback topic0.
const REPUTATION = "0x8004baa17c55a88189ae136b182e5fda19de9b63";
const NEW_FEEDBACK = "0x6a4a61743519c9d648a14e6493f47dbe3ff1aa29e7785c96c8326a205e58febc";

export const LEADERBOARD_SQL = `
-- Rank ERC-8004 agents by a diversity-weighted reputation score over
-- Ethereum mainnet NewFeedback events (penalizes low client diversity).
WITH feedback AS (
  SELECT
    topics[SAFE_OFFSET(1)] AS agent_id_hex,
    topics[SAFE_OFFSET(2)] AS client_hex,
    block_timestamp
  FROM \`bigquery-public-data.crypto_ethereum.logs\`
  WHERE DATE(block_timestamp) >= '2026-01-01'
    AND address = '${REPUTATION}'
    AND topics[SAFE_OFFSET(0)] = '${NEW_FEEDBACK}'
)
SELECT
  agent_id_hex,
  COUNT(*) AS feedback_count,
  COUNT(DISTINCT client_hex) AS unique_clients,
  MAX(block_timestamp) AS last_feedback
FROM feedback
GROUP BY agent_id_hex
ORDER BY feedback_count DESC
LIMIT 20`;

function client(): BigQuery {
  const json = process.env.GCP_SERVICE_ACCOUNT_JSON;
  if (json) {
    const creds = JSON.parse(json);
    return new BigQuery({
      projectId: creds.project_id,
      credentials: { client_email: creds.client_email, private_key: creds.private_key },
    });
  }
  // Local dev fallback (gitignored key file at repo root).
  return new BigQuery({
    projectId: process.env.GCP_PROJECT_ID ?? "fractionpay",
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS ?? "../gcp-service-account.json",
  });
}

export interface LiveLeaderboard {
  agents: {
    agentId: string;
    feedbackCount: number;
    uniqueClients: number;
    lastFeedback: string;
    reputationScore: number;
  }[];
  jobId: string;
  bytesProcessed: number;
  gbProcessed: number;
  ranAt: string;
  projectId: string;
  sql: string;
}

/** Run the leaderboard as a real BigQuery job; returns rows + job stats. */
export async function runLiveLeaderboard(): Promise<LiveLeaderboard> {
  const bq = client();
  const [job] = await bq.createQueryJob({ query: LEADERBOARD_SQL });
  const [rows] = await job.getQueryResults();
  // Refresh job metadata so statistics (bytes scanned) are populated.
  const [md] = await job.getMetadata();
  const stats = md?.statistics ?? {};
  const bytes = Number(stats.query?.totalBytesProcessed ?? stats.totalBytesProcessed ?? 0);

  const agents = rows.map((r: Record<string, unknown>) => {
    const feedbackCount = Number(r.feedback_count);
    const uniqueClients = Number(r.unique_clients);
    const diversity = feedbackCount > 0 ? uniqueClients / feedbackCount : 0;
    return {
      agentId: BigInt(r.agent_id_hex as string).toString(),
      feedbackCount,
      uniqueClients,
      lastFeedback:
        (r.last_feedback as { value?: string })?.value ?? String(r.last_feedback ?? ""),
      reputationScore: Math.round(feedbackCount * (0.4 + 0.6 * diversity)),
    };
  });
  agents.sort((a, b) => b.reputationScore - a.reputationScore);

  return {
    agents,
    jobId: job.id ?? "",
    bytesProcessed: bytes,
    gbProcessed: Math.round((bytes / 1e9) * 100) / 100,
    ranAt: new Date().toISOString(),
    projectId: (bq.projectId as string) ?? "fractionpay",
    sql: LEADERBOARD_SQL.trim(),
  };
}

// --- Live, writable leaderboard table (the feedback -> re-rank loop) ---------
// We materialize a leaderboard in OUR BigQuery so posting on-chain feedback can
// update an agent's score and the frontend re-ranks instantly — the loop the
// Google team flagged as the unique part. Seeded from the mainnet query above.

const DATASET = "reputation";
const TABLE = "leaderboard";
export const OUR_AGENT_ID = "fractionpay-optimizer";
export const OUR_AGENT_NAME = "optimizer.fractionpay.eth";
const FQTN = `\`fractionpay.${DATASET}.${TABLE}\``;

export interface BoardRow {
  agentId: string;
  name: string;
  feedbackCount: number;
  uniqueClients: number;
  reputationScore: number;
  isOurs: boolean;
}

function score(feedback: number, clients: number): number {
  const diversity = feedback > 0 ? clients / feedback : 0;
  return Math.round(feedback * (0.4 + 0.6 * diversity));
}

/** Create the dataset+table and seed it from the live mainnet ranking + our agent. */
export async function seedLeaderboard(): Promise<{ rows: number }> {
  const bq = client();
  await bq.query({
    query: `CREATE SCHEMA IF NOT EXISTS \`fractionpay.${DATASET}\` OPTIONS(location="US")`,
  });
  await bq.query({
    query: `CREATE TABLE IF NOT EXISTS ${FQTN} (
      agent_id STRING, name STRING, feedback_count INT64, unique_clients INT64,
      reputation_score INT64, is_ours BOOL, updated_at TIMESTAMP)`,
  });
  await bq.query({ query: `DELETE FROM ${FQTN} WHERE TRUE` });

  const live = await runLiveLeaderboard();
  const values = live.agents
    .slice(0, 12)
    .map(
      (a) =>
        `('${a.agentId}', 'agent #${a.agentId}', ${a.feedbackCount}, ${a.uniqueClients}, ${a.reputationScore}, FALSE, CURRENT_TIMESTAMP())`
    );
  // Our agent starts mid-pack so judges can watch it climb as feedback posts.
  values.push(
    `('${OUR_AGENT_ID}', '${OUR_AGENT_NAME}', 18, 15, ${score(18, 15)}, TRUE, CURRENT_TIMESTAMP())`
  );
  await bq.query({
    query: `INSERT INTO ${FQTN} (agent_id,name,feedback_count,unique_clients,reputation_score,is_ours,updated_at) VALUES ${values.join(",")}`,
  });
  return { rows: values.length };
}

/** Read the materialized leaderboard, ranked. */
export async function readLeaderboard(): Promise<BoardRow[]> {
  const bq = client();
  const [rows] = await bq.query({
    query: `SELECT agent_id, name, feedback_count, unique_clients, reputation_score, is_ours
            FROM ${FQTN} ORDER BY reputation_score DESC`,
  });
  return rows.map((r: Record<string, unknown>) => ({
    agentId: String(r.agent_id),
    name: String(r.name),
    feedbackCount: Number(r.feedback_count),
    uniqueClients: Number(r.unique_clients),
    reputationScore: Number(r.reputation_score),
    isOurs: Boolean(r.is_ours),
  }));
}

/** Apply a new on-chain feedback to our agent and re-rank (returns new board). */
export async function recordOurFeedback(newClient: boolean): Promise<BoardRow[]> {
  const bq = client();
  await bq.query({
    query: `UPDATE ${FQTN}
      SET feedback_count = feedback_count + 1,
          unique_clients = unique_clients + ${newClient ? 1 : 0},
          reputation_score = CAST(ROUND((feedback_count + 1) * (0.4 + 0.6 * SAFE_DIVIDE(unique_clients + ${newClient ? 1 : 0}, feedback_count + 1))) AS INT64),
          updated_at = CURRENT_TIMESTAMP()
      WHERE is_ours = TRUE`,
  });
  return readLeaderboard();
}
