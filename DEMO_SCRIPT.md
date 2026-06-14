# FractionPay — 3-minute demo script

**Live:** https://fractionpayy.vercel.app · **Tracks:** Google Cloud · Arc · ENS

---

## ⏱️ Pre-flight (do BEFORE you present — 60 sec, off-screen)

1. Open the site, **connect your MetaMask `0xce22…`** (top-right). Approve the Arc network add if prompted.
2. Go to **`/dashboard`** → click **"Fund my wallet (test USDC + RWAs)"** → wait for the green ✓.
   - This gives your wallet native Arc gas + 50k USDC + a starter RWA basket + property shares.
3. Go to **`/property`** → click **"Distribute quarterly rent"** once (sign in wallet).
   - This makes a real dividend available so your **Claim** button is live during the demo.
4. Open **`/agents`** in a second tab. Leave it on the leaderboard (you start at **#3 / #2**).
5. Have a block explorer tab ready: `https://testnet.arcscan.app`.

> Fallback: if any wallet popup stalls live, refresh and retry — the faucet is idempotent and
> all reads are on-chain, so nothing gets into a bad state.

---

## 🎬 The script (≈3:00)

### 0:00 – 0:25 — The hook
> "You own $20K of tokenized real estate, gold, and T-bills — all earning yield. But you can't
> buy a coffee with it. FractionPay turns that locked-up portfolio into a tap-to-pay card, and
> an AI agent decides which sliver to sell so you lose the least income."

*(On `/dashboard` — point at the portfolio value + blended yield. "This is my wallet, on-chain, on Arc.")*

### 0:25 – 1:25 — SPEND (the money shot — **Arc + ENS + the agent**)
- Click **Pay** → you land on **`/pay/coffeeshop.fractionpay.eth`**.
> "The merchant is just an ENS name — `coffeeshop.fractionpay.eth`. The page resolved the
> address and settlement config **live from mainnet ENS** — that badge says ✓ resolved via ENS." **(ENS)**

- Amount is `$6.00`. Click **"Hire optimizer agent."**
> "FractionPay doesn't decide what to sell. It **hires an agent from an open marketplace** and
> **pays it $0.001 via x402** — that fee's a line item on the receipt." **(agent economy / x402)**

- The plan appears: *Sell X% of XAUM (gold)*. Point at the stepper.
> "The agent picked **gold — my zero-yield asset** — so I lose $0/yr in income. Watch the steps:
> agent hired & paid, slice quoted by the Arc vault via Chainlink, now I approve and settle."

- Click **"Pay Brooklyn Coffee Co. $6"** → **approve** in MetaMask → **confirm** the settlement.
> "Every step is signed by **my own wallet** — Arc uses **USDC as its gas token**. The vault just
> swapped my gold slice into USDC and paid the merchant **on Arc**." **(Arc)**

- Receipt shows: settlement tx, x402 tx, "scored 100/100 → #N on leaderboard." Click the **settlement tx**.
> "Real on-chain settlement — here it is on the Arc explorer."

### 1:25 – 2:15 — REPUTATION + GOOGLE (the unique loop)
- Switch to the **`/agents`** tab.
> "Here's where Google comes in. We rank **34,000+ real ERC-8004 agents on Ethereum mainnet**
> using **BigQuery**." Click **"Run live BigQuery query."**
> "That's a real query against `crypto_ethereum` — job ID, bytes scanned, the SQL, all shown."

- Point to the **marketplace leaderboard** below (your agent `optimizer.fractionpay.eth`).
> "The raw mainnet board doesn't list our agent yet — it's new. Our marketplace board adds it.
> Now watch:" click **"Run the agent on a payment."**
> "That fires a **real `giveFeedback` transaction on Ethereum**, BigQuery re-scores it, and the
> leaderboard **physically re-ranks** — climbing toward #1. Feedback → reputation → re-rank,
> closed on-chain + Google Cloud." **(Google)**

- *(Optional)* Click **"Run registrations query"** → the weekly-growth chart.
> "A second live BigQuery job — the agent economy's actual growth on mainnet."

### 2:15 – 2:50 — TOKENIZE + EARN (full lifecycle — **Arc depth**)
- Go to **`/admin`** (connected as `0xce22`, the issuer/owner).
> "I'm the issuer. I can tokenize a new real-world asset live." Fill the form → **"Tokenize & list."**
> Sign the deploys. "That **deployed a new share token + price feed on Arc**, registered it
> spendable in the vault, and listed it — every step signed by my wallet."

- *(If short on time, skip the deploy and just say it.)* Flip to **`/property`**:
> "And income flows back: rental income pays out as **USDC dividends, pro-rata, on-chain**." Click **Claim**.
> "Issue → earn → spend, all in programmable stablecoins on Arc."

### 2:50 – 3:00 — Close
> "So: tap an **ENS** name, hire a **Google-BigQuery-ranked** agent from an open economy, and
> settle a fraction of a skyscraper in USDC **on Arc** — your money earns until the last second.
> Everything you saw was a real transaction."

---

## 🎯 One-liners per track (if a judge asks "what's the integration?")

- **Google Cloud:** "Two live BigQuery jobs over Ethereum mainnet — we rank 34k ERC-8004 agents
  by a diversity-weighted reputation score, and rating our agent writes feedback on-chain that
  re-ranks the board live. Rank → hire → pay → rate → re-rank, closed on-chain + GCP."
- **Arc:** "The whole RWA lifecycle on Arc with USDC-as-gas: tokenize, pay rent as USDC dividends,
  and spend a fraction of an asset — the vault oracle-prices the slice (Chainlink) and settles
  to the merchant. Every action is signed by the user's own wallet."
- **ENS:** "Merchants *are* ENS names; the pay page resolves address + settlement config from
  mainnet ENS text records. Our agent's identity is `optimizer.fractionpay.eth` too."

## ⚠️ Honesty notes (if asked what's staged)
- Our agent's **starting** leaderboard numbers are hand-seeded so it opens at #3 — it's a new
  agent with no mainnet history. The other agents are genuinely mainnet data, and every click
  from there is a real tx + real BigQuery write.
- The agent's x402 fee + the on-chain rating are signed by the FractionPay service wallet
  ("the platform fronts the $0.001 fee on the user's behalf"). Everything else is your wallet.
