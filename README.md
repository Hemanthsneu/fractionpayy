# FractionPay — your portfolio is your payment method

**Tap to pay with fractions of your tokenized real-world assets.** An NFC tap or QR
scan opens a merchant's ENS-named payment page. You enter an amount, and FractionPay
**hires an autonomous optimizer agent** from an open on-chain marketplace — ranked by
ERC-8004 reputation we compute with BigQuery over Ethereum mainnet, paid per-decision
via x402 — which picks the optimal asset to liquidate. One tap settles it on Arc in
USDC, and the agent's reputation updates on-chain.

🔗 **Live:** https://fractionpayy.vercel.app
📺 **Demo:** _(Loom link)_

---

## The 60-second story

> You own $200K in tokenized T-bills, gold, and real estate earning yield — but you
> can't buy a coffee with them. FractionPay unlocks that. Tap a merchant's NFC card,
> and an AI agent you *hire from an open marketplace* liquidates exactly the right
> sliver of the right asset, settling in USDC. Your money earns until the last second.

What makes it different from "just sell crypto to pay":
1. **Physical → digital** — NFC tap / QR, no app install, merchant onboarding is one ENS name.
2. **An open agent economy** — FractionPay doesn't decide what to sell. It hires the
   top-ranked optimizer from 34,000+ ERC-8004 agents on Ethereum mainnet (agent **#6553**)
   and pays it $0.001 via x402. The agent's fee is a line item on your receipt.
3. **Reputation closes on-chain** — after settlement, feedback is posted to the
   ERC-8004 Reputation Registry. The marketplace self-corrects.

---

## Architecture

```
PHONE  ──tap NFC / scan QR──▶  /pay/<merchant>.fractionpay.eth
                                      │  ENS resolves merchant (address + config)
                                      ▼
                        ┌─── AGENT ECONOMY (the differentiator) ───┐
                        │  BigQuery ranks mainnet ERC-8004 agents   │
                        │  Hire top agent → x402 pay $0.001 USDC    │
                        │  Agent returns liquidation plan           │
                        └───────────────────┬───────────────────────┘
                                            ▼
                        FractionPayVault on Arc (Chainlink-priced):
                        approve RWA → oracle quote → USDC to merchant
                        (every step signed by the payer's own wallet)
                                            ▼
                        ERC-8004 feedback posted → reputation loop closed
```

## Sponsor integrations (with on-chain evidence)

| Sponsor | What we built | Evidence |
|---|---|---|
| **Google Cloud** | Rank mainnet ERC-8004 agents via BigQuery; hire + x402-pay + rate | leaderboard from `bigquery-public-data.crypto_ethereum`, 34,422 agents |
| **Arc** | USDC settlement, conditional multi-step (appraise→price→settle) | FractionPay `0x4920038eA3f321B2C501a1e4f152a3Cc13f420C4`, tx `0x0a5cb54d…` ($6 settled) |
| **ENS** | Merchants = ENS names; NFC/QR encode them; agent = `optimizer.fractionpay.eth` | subnames under `fractionpay.eth` |
| **x402 / ERC-8004** | Agent #7031 registered; paywalled `/api/optimize`; real micro-settlements | agent #7031 (Base Sepolia), x402 tx `0x09ca8b7b…`, `0x3eda0a18…` |
| **Chainlink** | Price Feeds (AggregatorV3Interface) value RWAs on-chain at payment time | feeds in `quote()`; CRE workflow in `cre-workflow/` |
| **World** | Proof-of-personhood gate before first payment (sybil-resistant) | IDKit device-level + server verify, action `verify-human` |
| **Dynamic** | Wallet auth + embedded wallets; Flow funding option | `DynamicWidget`, env `7876a7d7…` |
| **Privy** | Optimizer agent's treasury is a Privy server wallet | app `cmqbe15hf…` |

## Repo layout

```
contracts/    Foundry — FractionPay router + mocks + Chainlink-compatible feeds (9 tests)
app/          Next.js 16 — pay flow, agent marketplace, merchant QR cards, all API routes
cre-workflow/ Chainlink CRE workflow (orchestration)
prep/         x402 prototype, BigQuery SQL, setup notes
```

## Run locally

```bash
# contracts
cd contracts && forge test

# app
cd app && npm install && npm run dev   # needs app/.env.local (see .env.example)
```

## Deployed addresses (Arc testnet, chain 5042002)

| Contract | Address |
|---|---|
| FractionPayVault (ERC-4626 + payments) | `0x3FbE9FA34858Af481625849144fA14726E25670f` |
| RWAMarket (primary market) | `0xB3624f299fb080c36c9535CA1C270c08b5d95390` |
| PropertyToken (Manhattan Office Tower) | `0x805F070884DF5d83B669EbDceA2C16A68954976f` |
| MockUSDC | `0x9EEDcFcE92Dfa9E3CC8D3D530EEA6e49F6FB1BDC` |
| EURC | `0x2cE98E09447ABf7c7F971a3FC76DE59354c8e8cC` |
| TBILL / feed | `0x11F14c31…` / `0xC4a98aa2…` |
| XAUM / feed | `0x7B71200f…` / `0x52Dd81A1…` |
| MREIT / feed | `0xa112A863…` / `0x52ce5E74…` |

The issuer/admin wallet `0xce22e02b82a20bE9c59dc11161778469B2Bf7C26` owns the
contracts and `fractionpay.eth`; tokenize/register/list are signed by it wallet-side.

ERC-8004: our optimizer agent is **#6553 on Ethereum Sepolia** (Identity/Reputation
`0x8004A818…` / `0x8004B663…`), `optimizer.fractionpay.eth` → `0x69C4…8F30`.
x402 micro-payments settle on Base Sepolia.
