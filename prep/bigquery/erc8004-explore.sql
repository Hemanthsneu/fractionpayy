-- ============================================================
-- ERC-8004 exploration queries — Ethereum mainnet via BigQuery
-- Dataset: bigquery-public-data.crypto_ethereum (public, free tier OK)
--
-- Registry addresses (per-chain singletons, same on all mainnets):
--   Identity Registry:   0x8004a169fb4a3325136eb29fa0ceb6d2e539a432
--   Reputation Registry: 0x8004baa17c55a88189ae136b182e5fda19de9b63
--
-- Event topic0 hashes (computed with `cast sig-event`):
--   Registered(uint256,string,address):
--     0xca52e62c367d81bb2e328eb795f7c7ba24afb478408a26c0e201d155c449bc4a
--   NewFeedback(uint256,address,uint64,int128,uint8,string,string,string,string,string,bytes32):
--     0x6a4a61743519c9d648a14e6493f47dbe3ff1aa29e7785c96c8326a205e58febc
--   MetadataSet(uint256,string,string,bytes):
--     0x2c149ed548c6d2993cd73efe187df6eccabe4538091b33adbd25fafdb8a1468b
--
-- ⚠️ VERIFY before trusting: open a real Registered tx on Etherscan for
-- 0x8004A169... and confirm topic0 matches the hash above (the deployed
-- contracts could differ slightly from the EIP draft text).
-- ============================================================

-- ------------------------------------------------------------
-- Query 1: Sanity check — are registrations visible? (run this FIRST)
-- ------------------------------------------------------------
SELECT
  COUNT(*) AS total_registrations,
  MIN(block_timestamp) AS first_registration,
  MAX(block_timestamp) AS latest_registration
FROM `bigquery-public-data.crypto_ethereum.logs`
WHERE address = '0x8004a169fb4a3325136eb29fa0ceb6d2e539a432'
  AND topics[SAFE_OFFSET(0)] = '0xca52e62c367d81bb2e328eb795f7c7ba24afb478408a26c0e201d155c449bc4a'
  AND DATE(block_timestamp) >= '2026-01-01';

-- ------------------------------------------------------------
-- Query 2: Registrations per week (nice chart for the demo/marketplace)
-- ------------------------------------------------------------
SELECT
  DATE_TRUNC(DATE(block_timestamp), WEEK) AS week,
  COUNT(*) AS new_agents
FROM `bigquery-public-data.crypto_ethereum.logs`
WHERE address = '0x8004a169fb4a3325136eb29fa0ceb6d2e539a432'
  AND topics[SAFE_OFFSET(0)] = '0xca52e62c367d81bb2e328eb795f7c7ba24afb478408a26c0e201d155c449bc4a'
GROUP BY week
ORDER BY week;

-- ------------------------------------------------------------
-- Query 3: THE LEADERBOARD — agents ranked by feedback volume + clients
-- agentId is topics[1] (indexed uint256), client is topics[2] (indexed address)
-- ------------------------------------------------------------
WITH feedback AS (
  SELECT
    topics[SAFE_OFFSET(1)] AS agent_id_hex,
    topics[SAFE_OFFSET(2)] AS client_hex,
    block_timestamp
  FROM `bigquery-public-data.crypto_ethereum.logs`
  WHERE address = '0x8004baa17c55a88189ae136b182e5fda19de9b63'
    AND topics[SAFE_OFFSET(0)] = '0x6a4a61743519c9d648a14e6493f47dbe3ff1aa29e7785c96c8326a205e58febc'
)
SELECT
  -- decode the indexed uint256 agentId from its 32-byte hex topic
  CAST(CONCAT('0x', LTRIM(SUBSTR(agent_id_hex, 3), '0')) AS STRING) AS agent_id,
  COUNT(*) AS feedback_count,
  COUNT(DISTINCT client_hex) AS unique_clients,
  MAX(block_timestamp) AS last_feedback,
  -- naive reputation score: feedback volume weighted by client diversity
  ROUND(COUNT(*) * (COUNT(DISTINCT client_hex) / COUNT(*)) * 10, 2) AS reputation_score
FROM feedback
GROUP BY agent_id_hex
ORDER BY reputation_score DESC
LIMIT 50;

-- ------------------------------------------------------------
-- Query 4: Join leaderboard to registration (get each agent's agentURI)
-- agentURI is a non-indexed string in the Registered event data field —
-- it's ABI-encoded. For the MVP, fetch the URI off-chain per agentId via
-- tokenURI(agentId) RPC call instead of decoding here. This query just
-- gets each ranked agent's registration tx + owner.
-- ------------------------------------------------------------
SELECT
  topics[SAFE_OFFSET(1)] AS agent_id_hex,
  CONCAT('0x', SUBSTR(topics[SAFE_OFFSET(2)], 27)) AS owner_address,
  transaction_hash AS registration_tx,
  block_timestamp AS registered_at
FROM `bigquery-public-data.crypto_ethereum.logs`
WHERE address = '0x8004a169fb4a3325136eb29fa0ceb6d2e539a432'
  AND topics[SAFE_OFFSET(0)] = '0xca52e62c367d81bb2e328eb795f7c7ba24afb478408a26c0e201d155c449bc4a'
ORDER BY block_timestamp DESC
LIMIT 100;
