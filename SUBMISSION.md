# FractionPay — ETHGlobal Submission Materials

Paste these per-track on the submission form. Each leads with WHY the product needs
the integration (judges discount checkbox integrations), then the concrete evidence.

**Live:** https://fractionpayy.vercel.app · **Repo:** https://github.com/Hemanthsneu/fractionpay
**Loom:** _(add link)_

---

## Tagline (160 chars)
Tap to pay with fractions of your tokenized real-world assets. An ENS-named merchant, an AI optimizer hired from an on-chain agent economy, settled in USDC on Arc.

## Short description
FractionPay turns your yield-earning RWA portfolio into a payment method. Tap a merchant's
NFC card (an ENS name) → FractionPay hires the top-ranked optimizer agent from an open
ERC-8004 marketplace (ranked via BigQuery over Ethereum mainnet, paid $0.001 via x402) →
the agent picks the optimal asset to liquidate → one tap settles USDC to the merchant on
Arc, priced by Chainlink → the agent's reputation updates on-chain. Sybil-gated by World ID.

---

## Per-track blurbs

### Google Cloud — Best On-Chain Agent Economy Application
FractionPay's optimizer is a real participant in an open agent economy. We rank optimizer
agents using **BigQuery over Ethereum MAINNET ERC-8004 data** (the Reputation Registry at
`0x8004BAa1…9b63`, 34,422 registered agents), with a diversity-weighted score that
penalizes reputation inflation from low client-diversity. FractionPay auto-hires the top
agent, pays it per decision via **x402** ($0.001 USDC, Base Sepolia), and posts feedback
back to the Reputation Registry after settlement — a complete rank → hire → pay → rate loop.
See `/agents` and `/api/agents`. Evidence: x402 settlement tx `0x3eda0a18…`.

### Arc — Advanced Stablecoin Logic / Agentic Economy
USDC settlement on Arc (chain 5042002) with conditional multi-step logic: an off-chain
optimizer appraises the portfolio, the contract verifies a Chainlink oracle price (with
staleness + slippage guards), then settles USDC to the merchant atomically. The agent leg
demonstrates the Circle agentic economy — an autonomous agent earning USDC nanopayments
for compute. FractionPay `0x4920038eA3f321B2C501a1e4f152a3Cc13f420C4`; live $6 settlement
tx `0x0a5cb54d…`.

### ENS — Most Creative Use / AI Agents / Integrate
Merchants ARE ENS names: NFC cards and QR codes encode `coffeeshop.fractionpay.eth` etc.,
and text records hold settlement config (`fractionpay.name/tokens/chain`). The payment page
resolves live from mainnet ENS. Our optimizer agent's identity is `optimizer.fractionpay.eth`,
resolving to its ERC-8004 agent card and x402 endpoint — the agent's name IS its ENS name.

### x402 — (via Arc / agentic tracks)
Every optimizer decision is gated behind HTTP 402: `/api/optimize` returns payment
requirements; FractionPay's server-side x402 client signs an EIP-3009 USDC authorization,
the public facilitator settles on Base Sepolia, and the plan is returned. Real settlements:
`0x09ca8b7b…`, `0x3eda0a18…`.

### Chainlink — Price Feeds (Connect the World) + CRE
RWAs are valued on-chain at payment time via AggregatorV3Interface price feeds (8-dec USD),
consumed in `FractionPay.quote()` with a 1-day staleness check — a real on-chain state
change driven by oracle data. A CRE workflow (`cre-workflow/`) orchestrates the
price→agent→settle pipeline.

### Uniswap — Best API Integration
FractionPay sources the live best-execution price/route for the conversion leg via the
**Uniswap Trading API** (developer-key gated), shown in the payment plan with route + price
impact. For real RWA tokens trading on Uniswap this is the actual execution route. See
`/api/uniswap-quote`.

### World — Track B (Proof of Personhood)
World ID gates the first payment per human — sybil-resistant payment identity. IDKit
device-level verification, proof validated server-side against the World portal v2 API,
action `verify-human` (max 1 verification per human). See `WorldGate` + `/api/verify-world`.

### Dynamic — Best Use of Flow / Best Overall
Dynamic powers all wallet auth and embedded wallets (`DynamicWidget`); Flow lets buyers
fund a payment from any wallet, chain, or exchange. Environment `7876a7d7…`.

### Privy — Best AI agent
The optimizer agent's treasury is a Privy server wallet — it receives x402 fees and is the
agent's autonomous account. App `cmqbe15hf…`.

---

## Honest depth notes (for our own prioritization, do NOT paste)
- Strongest, fully proven: Google/ERC-8004/x402, Arc, Chainlink feeds, ENS, World.
- Lighter: Uniswap (reference quote), Dynamic Flow, Privy wallet, CRE (artifact+sim).
- Lead every submission with product necessity, not "we integrated X."
