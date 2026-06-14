# FractionPay × Google Cloud

## 1. Title + one-line hook

**FractionPay: BigQuery as the credit bureau for the on-chain AI-agent economy.**
We rank every ERC-8004 agent straight off Ethereum mainnet logs in BigQuery, then close a live, automatic, performance-driven reputation loop that writes the verdict back on-chain.

---

## 2. The 30-second pitch (say this first at the booth)

"AI agents are about to transact with each other for money — but there's no credit bureau for them. We built one on BigQuery. We run a real query over `bigquery-public-data.crypto_ethereum.logs` — Ethereum *mainnet* — and rank live ERC-8004 agents by a **diversity-weighted reputation score** that mathematically defeats review-farming. Then we close the loop: our own agent gets paid $0.001 via x402 to optimize a payment, its *measured* yield-preservation score is posted on-chain as ERC-8004 feedback, and that score re-ranks a writable BigQuery table in front of you. Rank → hire → pay → rate → re-rank. Every step prints its own proof — the SQL, the BigQuery job ID, and the bytes scanned."

---

## 3. Why Google Cloud — the problem only this stack solves

The ERC-8004 agent economy is emerging on-chain, but reputation lives as raw `NewFeedback` and `Registered` event logs scattered across Ethereum mainnet. To turn that into a *trust ranking* you need to scan and aggregate the log history of two registry contracts — that is a genuine big-data problem, not a contract read.

- **BigQuery is the only practical way to do this.** A `getLogs` RPC pull over mainnet history is infeasible from a web app; BigQuery's `crypto_ethereum.logs` lets us `GROUP BY agent`, `COUNT(DISTINCT client)`, and rank in one job — a real, billed scan. The live job reports its own bytes; our route comment estimates ~226 GB / ~$1.40, but we display the *actual* `totalBytesProcessed` the job returns, never a hardcoded number.
- **It's a novel data application, not a dashboard.** We don't just read the chain — we compute a credit score over it and *write the result back on-chain* as ERC-8004 feedback. BigQuery is the bureau; Ethereum is the ledger it reports to.
- **The writable table makes it a living system.** We materialize a leaderboard in our own BigQuery project (`fractionpay.reputation.leaderboard`) and run a real `UPDATE` on every payment, so reputation is a continuously-recomputed BigQuery artifact, not a static snapshot.

---

## 4. What we built on Google Cloud (technical depth)

All paths under `/Users/hemanth/eth brain stroming/fractionpayy/app/src/`.

**A. Live mainnet leaderboard query** — `lib/bigquery.ts:29-50`, `:86-125`
A real `createQueryJob` against `` `bigquery-public-data.crypto_ethereum.logs` ``, filtered to the mainnet Reputation Registry `0x8004baa17c55a88189ae136b182e5fda19de9b63` and the `NewFeedback` topic0, grouped by `agent_id_hex`, `LIMIT 20` (the query also bounds `DATE(block_timestamp) >= '2026-01-01'`). After the query, job metadata is re-fetched to surface `totalBytesProcessed` and the job ID for on-screen proof (`bigquery.ts:90-98`).

**B. Diversity-weighted reputation score** — `bigquery.ts:110`, `:184`
`score = round(feedbackCount × (0.4 + 0.6 × uniqueClients/feedbackCount))`. A volume-farming agent with 1,000 reviews from 3 clients gets crushed by an honest agent with broad client diversity. This is the exact mechanism that makes the bureau trustworthy rather than gameable.

**C. Writable re-rank table** — `bigquery.ts:167-216`, `:219-247`
`CREATE SCHEMA` / `CREATE TABLE` / `DELETE` / `INSERT` into `fractionpay.reputation.leaderboard` (project `fractionpay`, dataset `reputation`, location US), seeded with the top-12 *real* mainnet agents (`bigquery.ts:202`) plus our agent. Re-rank is a real `UPDATE … WHERE is_ours = TRUE` (`bigquery.ts:238-245`). The writable path requires the service account to have BigQuery Data Editor and the table to be seeded via `/api/agents/setup`; if it isn't seeded, `/api/agents` serves the cached snapshot and the live `UPDATE` re-rank doesn't run — so seed before stage.

**D. Automatic, performance-driven loop** — `api/feedback/route.ts:40-93`, `lib/optimizer.ts:30-66`, `:77-81`
The agent's deterministic `planLiquidation` picks the lowest-yield slice to sell (`optimizer.ts:30-66`). `performanceScore = clamp(100 − (annualYieldLost/amount)×250, 50, 100)` (`optimizer.ts:78-80`). That score *is* the ERC-8004 feedback value, and a score ≥ 85 counts the run as a satisfied new client, raising diversity (`feedback/route.ts:30,57`). No thumbs-up — the on-chain rating is the agent's measured economic performance, derived from the plan rather than a human click.

**E. On-chain ERC-8004 feedback (Ethereum Sepolia)** — `api/feedback/route.ts:62-88`
A viem wallet calls `giveFeedback(agentId, value, …)` on reputation registry `0x8004B663056A597Dffe9eCcC1965A193B7388713`. It fires as a real `writeContract` only when a funded `BUYER_PRIVATE_KEY` and `FRACTIONPAY_AGENT_ID_ETH` are present; otherwise it fails gracefully into `chainError` (best-effort, never blocks the demo).

**F. x402-paywalled agent endpoint** — `api/optimize/route.ts:55-65`
`withX402(handler, 0x69C4…8F30, { price "$0.001", network "base-sepolia" })`. Unpaid calls get HTTP 402; payment settles to the agent wallet. (Demo escape hatch `X402_DISABLED=1` serves the plan unpaywalled if the facilitator is down.)

**G. Second live mainnet job** — `bigquery.ts:17-27`, `:138-160`
Agent registrations per week from the Identity Registry `0x8004a169fb4a3325136eb29fa0ceb6d2e539a432` (filtered by the `Registered` topic0) — measures the *growth* of the agent economy we're scoring.

---

## 5. Live demo script (~75s)

**Step 1 — The bureau (0:00–0:25).** Open **https://fractionpayy.vercel.app/agents**
*Judge sees:* the agent leaderboard with a self-auditing proof panel.
*Say:* "These rows are real ERC-8004 agents pulled from Ethereum mainnet. Watch the proof panel." Trigger the live run. *Judge sees:* the exact SQL, the BigQuery **job ID**, the **GB scanned** (read live from the job, not hardcoded), and GCP project `fractionpay`. *Say:* "Open BigQuery → Query History right now and you'll find this exact job. The score is diversity-weighted — a bot with 1,000 reviews from 3 wallets can't outrank an honest agent."
> Booth note: the live-query proof button (`/api/agents/live`) runs a genuine billed job with **no cache fallback** — if it errors, the panel shows the error, so confirm credentials before the run.

**Step 2 — The loop, the payment (0:25–0:55).** Open **https://fractionpayy.vercel.app/pay/coffeeshop**
*Judge sees:* a merchant resolved live from mainnet ENS, then the tap-to-spend flow. *Say:* "I pay the coffee shop. Our agent gets hired for $0.001 over x402, picks the lowest-yield slice to liquidate, and we settle on Arc." *Judge sees:* the plan with a human-readable reason ("XAUM earns no yield — selling it costs you $0/yr…") and a receipt with explorer links.
> Booth note: if the `coffeeshop.fractionpay.eth` subname/text records aren't live on mainnet, the page silently falls back to the built-in registry and the "✓ resolved via ENS" badge won't show — verify the badge appears in a dry run.

**Step 3 — The re-rank (0:55–1:15).** Back on **/agents**, run the feedback step.
*Say:* "That payment's *performance score* just posted on-chain as ERC-8004 feedback on Ethereum Sepolia, and re-ran an `UPDATE` on our writable BigQuery table. Our agent climbs the board — the score is computed from the optimization plan, not from someone clicking a star. We engineered its starting position to sit just below the leaders so you can watch it climb live; the climb itself runs through the same diversity formula every row uses."

---

## 6. On-chain / verifiable proof

**BigQuery (clickable by the judge):**
- Source table: `bigquery-public-data.crypto_ethereum.logs` (mainnet, public dataset).
- Writable table: `fractionpay.reputation.leaderboard` (project `fractionpay`, dataset `reputation`, US).
- Every run is a real job → **BigQuery → Query History** shows the job ID, bytes billed, and SQL the panel displayed.

**ERC-8004 registries:**
- Mainnet (queried): reputation `0x8004baa17c55a88189ae136b182e5fda19de9b63`, identity `0x8004a169fb4a3325136eb29fa0ceb6d2e539a432`.
- Ethereum Sepolia (feedback target): reputation `0x8004B663056A597Dffe9eCcC1965A193B7388713`, identity `0x8004A818BFB912233c491871b3d84c89A494BD9e`.

**Our agent registrations (full tx hashes recorded in repo `.env` as inline comments on the agent-id lines):**
- ETH Sepolia **#6553**, register tx `0x9740542e9b589f6dd09354bc6937d65bff8907c7ea78d6a05f6eeb400dbcfad9` → `https://sepolia.etherscan.io` (`.env:72`).
- Base Sepolia **#7031**, register tx `0x2d74c4968b1492b9ab12fa5d8beccecdecc41241b32d746f5199e799a78dbcf4` → `https://sepolia.basescan.org` (`.env:58`).

**Agent wallet / x402 receiver / ENS `optimizer.fractionpay.eth`:** `0x69C4b79F998e92267f116f12A3D9764ac77b8F30` (`optimize/route.ts:19`).
**Agent card:** `https://fractionpayy.vercel.app/.well-known/agent-card.json`.

> Honesty note for the booth: the per-payment `giveFeedback`/x402 settlement tx hashes appear only as truncated illustrative strings in `SUBMISSION.md:46-47` and `README.md:58`, and have no full version recorded anywhere in the repo — present them as "generated live," not as pre-confirmed. The two **register** tx hashes above are the only fully-recorded ones; cite those for certainty.

---

## 7. Why we win this track (mapped to the judging lens)

| Judging lens | Our evidence |
|---|---|
| **Real, non-trivial BigQuery at scale** | Two real `createQueryJob` runs over the mainnet public dataset (`crypto_ethereum.logs`), each a genuine billed scan whose bytes we surface live; plus a writable, continuously-`UPDATE`d table in our own project. No mocks (`bigquery.ts:86-125`, `:238-245`). |
| **Novel data application** | BigQuery isn't a chart — it's a *credit bureau* that scores agents with a diversity-weighted metric and **writes the verdict back on-chain** as ERC-8004 feedback. Rank → hire → pay → rate → re-rank is, to our knowledge, the first closed reputation loop between BigQuery and an on-chain agent registry. |
| **Technical depth** | Deterministic `planLiquidation` → `performanceScore` → on-chain `giveFeedback` → BigQuery `UPDATE` → live re-rank, with an x402 micropayment gating the agent, all in named files/contracts above. |
| **Verifiability** | Self-auditing panels print SQL + job ID + bytes; the judge can confirm the identical job in Query History and the agent registration on Etherscan. |

---

## 8. Tough Q&A

**Q: Is the BigQuery query real, or did you cache a JSON file?**
Real. `runLiveLeaderboard` calls `createQueryJob` against `bigquery-public-data.crypto_ethereum.logs`, then re-reads job metadata for `totalBytesProcessed` (`bigquery.ts:86-98`). You can find the exact job in Query History. Two separate surfaces, kept honest: the **leaderboard table** (`/api/agents`) has a fallback snapshot (`data/leaderboard.json`, dated 2026-06-12) so the table never shows blank if it isn't seeded; the **live-query proof button** (`/api/agents/live`) has *no* fallback — it runs a genuine job or errors (502). When BigQuery itself returns a cached result, the panel labels it honestly as 0 bytes billed (`AgentsLive.tsx:77,86`).

**Q: Your agent is #1 — did you just hardcode that?**
Partially, and we'll be precise: the *other* rows are real mainnet agents from the live query. Our agent has **no mainnet feedback history**, so its *starting* numbers are seeded — `(feedback_count=129, unique_clients=125)` at `bigquery.ts:210` — deliberately set just below the volume-farming leaders so it can visibly climb. Everything *after* the seed runs through the real math: each payment's `UPDATE` recomputes its score with the same diversity formula (`bigquery.ts:242`). The climb is engineered in starting position, not in formula.

**Q: The score formula — what actually stops review-farming?**
`score = feedbackCount × (0.4 + 0.6 × uniqueClients/feedbackCount)` (`bigquery.ts:110`). The `0.6 × diversity` term means feedback from the same few wallets adds almost nothing: 1,000 reviews from 3 clients gives diversity ≈ 0.003, so `round(1000 × (0.4 + 0.6×0.003)) = 402` — essentially the 0.4 floor (400) against a max-possible 1000. Broad client diversity is what moves the rank, and the UI flags low-diversity rows (`LiveLeaderboard.tsx:153`).

**Q: Is the on-chain feedback real or simulated?**
The `giveFeedback` write is real when a funded key and `FRACTIONPAY_AGENT_ID_ETH` are present — a real viem `writeContract` to the ETH Sepolia reputation registry (`feedback/route.ts:62-88`); it returns the tx or fails gracefully into `chainError`. The *score* it posts is the agent's deterministic measured performance, not a random value. In demo, the `simulate:true` path varies the payment *amount* over `[4,6,12,18,27]` via `Math.random()` (`feedback/route.ts:44`) so each run is a distinct task — the agent logic is real, the task is synthetic.

**Q: So in the demo, does your agent's score genuinely vary run-to-run?**
We're upfront: no, and that's by design. The demo portfolio's lowest-yield asset is XAUM at 0 bps (`deployments.ts:51-59`), so `planLiquidation` sells it, `annualYieldLost` is ~$0, and `performanceScore` lands at ~100 essentially every run regardless of the random amount. Because `newClient = score ≥ 85`, the climb is effectively guaranteed by construction. We frame this exactly like the #1-seed note: the run is *engineered to climb* so judges see the loop close live. What's real is the mechanism — the score is computed from the optimization plan and posted on-chain, not pulled from a thumbs-up. On a real portfolio with mixed yields, the same formula would produce genuine variance.

**Q: Which agent ID is real, #6553 or #7031?**
**#6553 on Ethereum Sepolia** is the identity the Google Cloud loop depends on — `optimize/route.ts:42`, env `FRACTIONPAY_AGENT_ID_ETH=6553`, the feedback write at `feedback/route.ts:63-84`, register tx `0x9740542e…` (recorded in `.env:72`, verify at sepolia.etherscan.io). We also registered #7031 on Base Sepolia earlier. The served `agent-card.json` is now aligned to **#6553 / `eip155:11155111`** with the wallet address declared, so the card and the running app agree.

**Q: How much does each scan cost, and is 226 GB accurate?**
The ~226 GB / ~$1.40 figure is a comment estimate in `agents/live/route.ts:5`, not a pinned value. We don't trust it — the panel displays the *actual* `totalBytesProcessed` the job reports at runtime (`bigquery.ts:96-98`). It's gated behind an explicit user click precisely because each run is a real billed scan.

**Q: What about your Solidity contracts — are they tested?**
The repo has **42 test functions** across four suites (`FractionPay.t.sol`, `FractionPayVault.t.sol`, `PropertyToken.t.sol`, `RWAMarket.t.sol`). If you see "35 Foundry tests" referenced in `SUBMISSION.md`, that figure is stale — use 42, and run `forge test` to confirm the pass status before quoting it on stage. (The Google Cloud track stands on the BigQuery loop above; the contracts are supporting infrastructure.)
