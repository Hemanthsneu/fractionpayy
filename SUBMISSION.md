# FractionPay — ETHGlobal NY 2026 Submission (3-track cap)

**Live:** https://fractionpayy.vercel.app · **Repo:** https://github.com/Hemanthsneu/fractionpayy
**Loom:** _(add link)_

> Rule: max 3 sponsor tracks per project. We submit to **Google Cloud, Arc, ENS** —
> our three deepest, fully-working, on-chain-proven integrations.
> (The product also uses x402, Chainlink price feeds, Dynamic, Privy, World ID —
> shown in the demo to make it real, but NOT submitted for prizes.)

## Tagline (160 chars)
Tap to pay with fractions of your tokenized real-world assets. An ENS-named merchant, an AI optimizer hired from an on-chain agent economy, settled in USDC on Arc.

## Short description
FractionPay turns a yield-earning RWA portfolio into a payment method. Tap a merchant's
NFC card (an ENS name) → FractionPay hires the top-ranked optimizer agent from an open
ERC-8004 marketplace (ranked via BigQuery over Ethereum mainnet, paid $0.001 via x402) →
the agent picks the optimal asset to liquidate → one tap settles USDC to the merchant on
Arc, priced by Chainlink → the agent's reputation updates on-chain.

---

## 1) Google Cloud — Best On-Chain Agent Economy Application  ($5,000)
**Why the product needs it:** FractionPay doesn't decide which asset to sell — it hires an
agent from an open marketplace and must rank thousands of them by trustworthiness.

**What we built:** We rank optimizer agents with **BigQuery over Ethereum MAINNET ERC-8004
data** — the Reputation Registry `0x8004BAa1…9b63` (34,000+ registered agents) — using a
**diversity-weighted score that penalizes reputation inflation** (low unique-client ratios
flagged). FractionPay auto-hires the top agent, **pays it per decision via x402**
($0.001 USDC), and **posts feedback back to the Reputation Registry on Ethereum** after
settlement — which **re-ranks the live BigQuery leaderboard in the frontend on the spot**.
Complete **rank → hire → pay → rate → re-rank** loop, closed on-chain. We run **two live
mainnet BigQuery jobs**: the reputation leaderboard *and* an agent-economy growth query
(registrations per week from the Identity Registry).

**Evidence:**
- `/agents` — the **raw mainnet leaderboard** (live BigQuery job over `crypto_ethereum`) plus
  our **writable marketplace table** that adds our agent and re-ranks on feedback. Each panel
  shows the SQL, job ID, and bytes scanned (a cached run is labelled honestly).
- A second live job: **ERC-8004 registrations per week** charted from the Identity Registry.
- Our agent **ERC-8004 #6553 on Ethereum Sepolia** (Identity Registry `0x8004A818…BD9e`,
  register tx `0x9740542e…`).
- **Every settlement automatically scores the agent on yield preserved and fires a real
  on-chain `giveFeedback` tx** to the Reputation Registry `0x8004B663…8713` on Ethereum
  Sepolia, updating the BigQuery score live — e.g. tx `0x83aebf7a…`, `0x5396…b469`.
- x402 settlement txs `0x09ca8b7b…`, `0x3eda0a18…` (Base Sepolia); fees land in the agent's
  own wallet `0x69C4…8F30` = `optimizer.fractionpay.eth`.

**Demo line:** "We rank 34,000 mainnet agents with BigQuery, hire the best one, and pay it a
tenth of a cent over x402 — the fee's on your receipt, and rating it re-ranks the board live."

---

## 2) Arc — Advanced Stablecoin Logic / Agentic Economy  (~$2,150)
**Why the product needs it:** the *entire RWA lifecycle* runs on programmable stablecoins —
income distribution AND payments.

**Self-custodied & wallet-native:** Arc uses **USDC as its native gas token**, so the app
funds a connected wallet with native gas + test USDC + a starter RWA basket, then **every
action — invest, pay, distribute, claim, tokenize — is signed by the user's own wallet**
(no server shadow wallet). The issuer wallet `0xce22…7C26` owns the contracts and
`fractionpay.eth`.

**What we built — a full RWA protocol on Arc:**
1. **Tokenize & distribute** — a $10M commercial property issued as fractional shares
   (`PropertyToken`, the Manhattan Office Tower); new assets are tokenized wallet-side from
   `/admin` (deploy token + feed → register in vault → list on market, all signed by the issuer).
2. **Stablecoin dividends** — rental income distributed **pro-rata in USDC** to every
   shareholder (audited cumulative-dividend accounting; correct across transfers). This is
   programmable stablecoin distribution / on-chain "payroll."
3. **Yield-bearing liquidity vault** — `FractionPayVault` is an **ERC-4626** vault: LPs deposit
   USDC and earn from protocol fees + RWA yield accrual (USD-denominated NAV across USDC +
   EURC·FX + RWAs).
4. **Multi-stablecoin settlement** — pay merchants in **USDC or EURC** via oracle FX.
5. **Yield-preserving liquidation** — the optimizer sells the least-disruptive slice; the
   contract **quantifies the yield preserved** on-chain.

Oracle safety hardened after an adversarial audit (per-feed try/catch isolation so one stale
feed can't freeze the vault; round-completeness + staleness checks; admin feed deactivation).
**42 Foundry tests across the suite (passing locally).**

**Evidence (Arc, chain 5042002 — all verifiable on `testnet.arcscan.app`):**
Vault `0x3FbE9FA34858Af481625849144fA14726E25670f` ·
RWAMarket `0xB3624f299fb080c36c9535CA1C270c08b5d95390` ·
PropertyToken `0x805F070884DF5d83B669EbDceA2C16A68954976f` ·
USDC `0x9EEDcFcE92Dfa9E3CC8D3D530EEA6e49F6FB1BDC`. Dividend, claim, invest and
settlement transactions are generated live in the demo — each receipt links straight
to the block explorer.

**Demo line:** "Tokenize a building, pay its rent as USDC dividends every quarter, and let
holders spend their shares anywhere — issue, earn, and spend, all in programmable stablecoins
on Arc."

---

## 3) ENS — Most Creative Use / AI Agents / Integrate  ($5,000 pool)
**Why the product needs it:** a merchant's entire onboarding is one ENS name; the agent needs
a portable identity.

**What we built:** Merchants **ARE** ENS names — `coffeeshop.fractionpay.eth` etc. NFC cards
and QR codes encode the ENS name; **text records** hold settlement config
(`fractionpay.name/tokens/chain`). The pay page resolves **live from mainnet ENS** (the badge
flips to "✓ resolved via ENS"). The optimizer agent's identity is `optimizer.fractionpay.eth`,
resolving to its ERC-8004 agent card + x402 endpoint — **the agent's name IS its ENS name.**

**Evidence:** subnames under `fractionpay.eth` with address + text records; pay page shows
"✓ resolved via ENS" live.

**Demo line:** "The NFC card holds one thing — the merchant's ENS name. Tap it and the whole
payment page resolves from mainnet ENS. Our AI agent has an ENS name too."

---

## Submission checklist
- [ ] Paste the 3 blurbs above into the ETHGlobal form (one per track)
- [ ] Add Loom link (top of this file + README)
- [ ] Confirm with organizers: a multi-subprize sponsor (ENS) = 1 of the 3 slots
- [ ] README link + live URL in the submission
- [ ] Lead each with WHY the product needs it (done above), not "we integrated X"
