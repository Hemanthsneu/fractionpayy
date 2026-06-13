# BigQuery × ERC-8004 — Prep Notes

Target track: **Google Cloud — Best On-Chain Agent Economy Application ($5,000, single prize)**
Requirement: rank agents by feedback/reputation using BigQuery on Ethereum mainnet ERC-8004 data, with x402 payment integration.

## Setup (do once, prep week)

1. Create a GCP project → enable **BigQuery** (sandbox = 1 TB queries/month free, no card needed)
2. BigQuery console → run **Query 1** from `erc8004-explore.sql` (sanity check)
3. Create a **service account** → role `BigQuery Job User` + `BigQuery Data Viewer` → download JSON key
4. Save key path into app `.env` as `GOOGLE_APPLICATION_CREDENTIALS`

## Key facts (verified 2026-06-12)

| Thing | Value |
|---|---|
| Identity Registry (ALL mainnets) | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |
| Reputation Registry (ALL mainnets) | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |
| Identity Registry (Base Sepolia + Sepolia) | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| Reputation Registry (Base Sepolia + Sepolia) | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |
| `Registered` topic0 | `0xca52e62c367d81bb2e328eb795f7c7ba24afb478408a26c0e201d155c449bc4a` |
| `NewFeedback` topic0 | `0x6a4a61743519c9d648a14e6493f47dbe3ff1aa29e7785c96c8326a205e58febc` |
| Public dataset | `bigquery-public-data.crypto_ethereum` (`logs` table) |
| Contracts repo (ABIs in `abis/`) | https://github.com/erc-8004/erc-8004-contracts |
| Mainnet status | Live since Jan 2026, 45k+ agents registered |

⚠️ **Verify topic0 against a real tx** on Etherscan before the event (open the
Identity Registry address → Events tab → compare `Registered` topic0).
The hashes above were computed from the EIP draft event signatures.

## At-event architecture (rebuild then — it's ~1 file)

```
Next.js API route /api/agents:
  1. BigQuery: leaderboard query (Query 3) — runs at most 1×/hour
  2. For top N agents: RPC tokenURI(agentId) → fetch agent card JSON
  3. Cache merged result as JSON (file or in-memory)
  4. /agents page renders the cached leaderboard — NEVER live-queries in demo
```

## Registration plan for OUR agent

1. Register on **Base Sepolia** Identity Registry (free, live writes for demo):
   `cast send 0x8004A818BFB912233c491871b3d84c89A494BD9e "register(string)" "https://pay.fractionpay.xyz/.well-known/agent-card.json" --rpc-url base-sepolia --private-key $AGENT_PK`
2. Optionally also register on **Ethereum mainnet** (~$1-5 gas) → "our agent
   is one of the 45,000" demo line + it shows up in our own BigQuery leaderboard
3. After each FractionPay settlement, post feedback to the Base Sepolia
   Reputation Registry → closes the rank → hire → pay → rate loop
