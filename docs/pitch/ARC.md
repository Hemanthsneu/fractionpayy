# FractionPay — Arc Track

## 1. Title + Hook

# FractionPay: Tokenize. Earn. **Spend** — all in USDC, on Arc.
*The only RWA app where the dollar that pays the merchant is the same dollar that pays for gas.*

---

## 2. The 30-Second Pitch

> "RWAs are great at *earning* and terrible at *spending* — you can't tap your tokenized T-bill at a coffee shop. FractionPay fixes that on Arc. We built a USD-denominated ERC-4626 vault that holds a basket of tokenized real-world assets — T-bills, gold, a REIT, AAPL, a money-market fund. When you pay a merchant, an agent liquidates the *least-disruptive slice* — the lowest-yield position — and settles the merchant in USDC or EURC. Because Arc uses **USDC as native gas**, the same dollar pays the merchant *and* the transaction. Tokenize → earn USDC dividends → spend fractions anywhere — the full RWA lifecycle, settled in stablecoins, on Arc."

---

## 3. Why Arc

The hard problem in RWA payments is the **unit of account mismatch**. A vault holding T-bills, gold, and a REIT is denominated in *dollars*, but every chain meters gas in a *volatile native token*. So a "stablecoin payment" still forces the user to hold a second, volatile asset just to move the first. That tax breaks the consumer-payment use case.

Arc removes the mismatch: **USDC is the native gas token** (chain `5042002`, 18-dec native USDC — `app/src/lib/chains.ts:5-16`). That single property is what makes FractionPay coherent:

- **One unit, end to end.** The merchant is paid in USDC, the fee accrues in USDC, the gas is paid in USDC. Our faucet bootstraps native-USDC gas so a fresh wallet can self-custody-sign every subsequent action (`api/faucet/route.ts:75-82`).
- **A USD-NAV vault makes sense only on a USD-native chain.** Our ERC-4626 share price tracks a real-time *dollar* NAV, not a raw token count. On a USD-gas chain, "deposit a dollar of value, withdraw a dollar of value, pay a dollar to a merchant" is one consistent denomination instead of three.
- **Fast, cheap settlement** is what lets a $0.001-agent-fee, fractional-RWA payment be economically real instead of a gas-dominated toy.

Arc is the only chain where "spend a fraction of your tokenized portfolio at a merchant" doesn't require the user to babysit a separate gas asset.

---

## 4. What We Built on Arc

Every Arc address below is cross-checked against the Foundry broadcast log `contracts/broadcast/DeployVault.s.sol/5042002/run-latest.json` — **every one matches its on-chain CREATE tx.**

**1. ERC-4626 USD-NAV vault (fpUSDC)** — `contracts/src/FractionPayVault.sol`
LPs deposit USDC for `fpUSDC` shares whose price tracks a **USD NAV**, not raw USDC. `totalAssets()` = USDC + Σ(other-stable · FX) + Σ(RWA · oracle price), all normalized to 6-dec USDC terms (`:191-206`; USD math at `:153-173`).

**2. Multi-stablecoin `pay()` with oracle FX** — `:237-281`, `quote()` `:225-233`
Liquidates an RWA slice and pays the merchant net (USD − fee) in their chosen stablecoin (USDC **or** EURC), converting via the stable's FX feed. The 0.50% fee (`feeBps`, capped at 200) is retained, lifting NAV for LPs. EURC routing wired server-side (`api/settle/route.ts:35`); 5% slippage guard via `minOut`, enforced on-chain (`:250`).

**3. Yield-preserved accounting — the agent's edge, quantified *on-chain*** — `_yieldPreservedPerYear()` `:285-298`
Every payment computes the annualized USD yield preserved by selling the chosen slice instead of the highest-APY held asset, accrues to `totalYieldPreservedUsd` (`:261`), and emits it in the `Settled` event (`:278-280`). The agent's decision quality is a number the contract itself records.

**4. Deterministic liquidation agent (`planLiquidation`)** — `app/src/lib/optimizer.ts:30-66`
Pure, no-LLM logic: filter positions that can cover the payment, sort by lowest `yieldBps` then largest position, return fraction + human-readable reason. Then `vault.quote(rwa, amt, payToken)` reads the live Arc NAV before settling (`PaymentFlow.tsx:68-79`).

**5. RWA primary market** — `contracts/src/RWAMarket.sol:88-101`
`invest()` routes USDC to treasury and mints fractional shares to the investor at the live oracle price. User-signed 2-tx flow (`approve` → `invest`) through the connected wallet (`Marketplace.tsx:42-64`).

**6. Property dividends in USDC** — `contracts/src/PropertyToken.sol:78-119`
Roger-Wu magnified-dividend-per-share accounting; `_update` correction term prevents double-claim/dilution on transfer; holders `claimDividend()`. This is how property yield is delivered — dividends, not price accrual.

**7. One-click issuer onboarding** — `app/src/app/api/admin/tokenize/route.ts:39-72`
Deploys a real MockRWA ERC-20 + YieldAggregator feed, then `registerRWA` (makes it **spendable**) + `list` (makes it **investable**) — **four real sequential transactions in one click** (each awaited independently; not a single atomic call).

**8. Oracle DoS hardening — handled, not hand-waved** — `:143-220`
Per-feed `try/catch` isolation so one stale/invalid feed can't brick deposits/withdrawals; `_price` rejects `answer ≤ 0`, incomplete rounds (`answeredInRound < roundId`), and age > `maxPriceAge` (7 days, tunable); owner can `setRWAActive/setStableActive(false)` to kill a dead feed; `maxWithdraw`/`maxRedeem` capped to actual USDC liquidity. Backed by dedicated tests: `test_staleFeedDoesNotBrickVault`, `test_zeroPriceFeedDoesNotBrickVault`, `test_ownerCanDeactivateDeadFeed`, `test_maxWithdrawCappedByLiquidity` (`contracts/test/FractionPayVault.t.sol`).

**Assets live on Arc:** USDC + EURC stables, and 5 RWAs — TBILL, XAUM (gold), MREIT, AAPL30, MMF — each with its own price feed, plus the MNHTN property token.

---

## 5. Live Demo Script (~75s)

**[0:00 — The pitch + the Arc hook] — `https://fractionpayy.vercel.app/dashboard`**
*Judge sees:* a portfolio of tokenized RWAs and a **native-gas balance labeled "USDC."**
*Say:* "This is a portfolio of tokenized real-world assets. Notice the gas balance — it's USDC. On Arc, the dollar that pays the merchant is the same dollar that pays for gas."

**[0:15 — Tap to spend] — `https://fractionpayy.vercel.app/pay/coffeeshop`**
*Judge sees:* a merchant pay page with a "✓ resolved via ENS" badge, an amount field.
*Say:* "This merchant config — settlement token, chain — resolves **live from mainnet ENS**. I'll pay for a coffee out of my RWA basket." Enter an amount.

**[0:30 — The agent plans] — same page, after "Hire agent"**
*Judge sees:* the state machine step "plan" with the on-screen reason *"XAUM earns no yield — selling it costs you $0/yr in lost income, keeping your … yield intact."*
*Say:* "The agent picks the **least-disruptive slice** — here it sells **XAUM, the gold position, because it earns zero yield** — so your best-earning assets keep compounding. That decision is deterministic, no LLM." *(In the default funded portfolio the lowest-yield slice is XAUM at 0 bps, so the agent sells gold — not MMF. Rehearse the line as "Selling XAUM / gold — earns no yield" to match the on-screen reason.)*

**[0:45 — Settle on Arc] — same page**
*Judge sees:* the Arc settlement step complete, a receipt with an explorer link, "Settled by: FractionPay relayer" *(only if the network-fallback path was taken)*.
*Say:* "It liquidated a fraction of the RWA and paid the merchant in USDC on Arc, keeping the asset at full USD value in the vault and the 0.50% fee for LPs. Here's the on-chain tx — `testnet.arcscan.app`."

**[1:00 — Issuer onboarding] — `https://fractionpayy.vercel.app/admin`**
*Judge sees:* a tokenize form (default BKWH — "Brooklyn Warehouse REIT").
*Say:* "Onboarding a new asset is one click: it deploys a real ERC-20 plus a price feed and makes it instantly **spendable and investable** on Arc — four real transactions."

**Backup tab open:** the vault on the explorer — `https://testnet.arcscan.app/address/0x3FbE9FA34858Af481625849144fA14726E25670f`.

---

## 6. On-Chain / Verifiable Proof

**Arc (chain 5042002, explorer `https://testnet.arcscan.app`)** — every address verified against the broadcast log:

| Contract | Address | Deploy tx |
|---|---|---|
| FractionPayVault | `0x3FbE9FA34858Af481625849144fA14726E25670f` | `0xfda0041088d1166822710576ab7b2e42d3e37c7ea32f7ca04b833aa6491159c8` |
| RWAMarket | `0xB3624f299fb080c36c9535CA1C270c08b5d95390` | `0x7720f045998f0a060d58be44c495068ac8575d6fdc383d47832ce9a14e26e20a` |
| PropertyToken (MNHTN) | `0x805F070884DF5d83B669EbDceA2C16A68954976f` | `0x6a8c40ac3c1d6648700578220ca04516afe3c742bd148a78ffb4f725d935e4cf` |
| USDC (MockStable) | `0x9EEDcFcE92Dfa9E3CC8D3D530EEA6e49F6FB1BDC` | `0x10917b172716915495e651ee0bf6b0ec14911f19dbc865dc718ec70813ce00db` |
| EURC (MockStable) | `0x2cE98E09447ABf7c7F971a3FC76DE59354c8e8cC` | `0x0a4bd2e4d9face74d8490d121d38a9f3f5feabbe3ce76f95f56702362c189724` |

**RWA tokens (all 5 confirmed in broadcast log):** TBILL `0x11F14c3105659e99138385470Ea884dbD802E68a`, XAUM `0x7B71200f8494F923972977620C61537Fa30eC484`, MREIT `0xa112A86390A3FdE652b264812B3Ee679a74578e6`, AAPL30 `0x863DbFc2bd2Cea6F1b23A069147743166265678E`, MMF `0xcA09A4da3e1b5759203011095Ba06C96D80E0d69` — each with its own deployed price feed.

**Click-to-verify:** `https://testnet.arcscan.app/address/0x3FbE9FA34858Af481625849144fA14726E25670f` (vault) — open the deploy tx above to confirm the CREATE.

**Cross-track proof a judge can also click:** ERC-8004 agent (#6553) registered on Ethereum Sepolia; ENS `fractionpay.eth` → `0xce22e02b82a20bE9c59dc11161778469B2Bf7C26` and `optimizer.fractionpay.eth` → agent `0x69C4b79F998e92267f116f12A3D9764ac77b8F30`, both live on mainnet.

---

## 7. Why We Win This Track

The Arc judging lens rewards **stablecoin-native financial apps that exploit Arc's USDC-as-native-gas + fast settlement for a real use case.** We map directly:

- **USDC-native, exhaustively.** Settlement currency, fee accrual, vault NAV denomination, *and gas* — all USDC. We don't just *accept* USDC; the whole product only makes sense on a USD-native chain (`chains.ts:5-16`).
- **A real use case, not a demo primitive.** The full RWA lifecycle: **tokenize → earn USDC dividends → spend fractions anywhere.** Spending tokenized RWAs at a merchant is the unmet need; we close it.
- **Genuine financial engineering on-chain.** ERC-4626 USD-NAV vault, multi-stablecoin `pay()` with oracle FX, on-chain yield-preserved accounting, audited dividend math, and adversarial oracle hardening with dedicated tests — not a thin wrapper.
- **Multi-stablecoin from day one.** USDC *and* EURC settlement via per-feed FX — exactly the Circle-stablecoin world Arc is built for.
- **It's deployed and verifiable.** 5 core contracts (Vault, RWAMarket, PropertyToken, USDC, EURC) + 5 RWAs each with a price feed, live on chain 5042002 — every address confirmed against the broadcast log.

---

## 8. Tough Q&A (honest)

**Q: Are these real Circle USDC/EURC and real RWAs?**
No — and we won't pretend otherwise. On testnet, "USDC"/"EURC" are `MockStable` contracts and the RWAs are `MockRWA`, priced by a self-written Chainlink-compatible `YieldAggregator` that linearly accrues APY, not a live Chainlink feed. What's **real** is the *architecture*: the ERC-4626 USD-NAV math, multi-stable `pay()` with FX, fee accrual, yield-preserved accounting, and oracle hardening are all genuine contract logic, deployed on Arc and exercised by the test suite. Swapping MockStable for Circle-issued USDC and the YieldAggregator for production Chainlink feeds is a config change, not a redesign.

**Q: Who signs the payment — the user or a server?**
The **user's wallet is the default.** `confirmPayment` first attempts the user-signed path — `approve` + `pay` signed through the visitor's wallet (`useArc` even auto-adds/switches the Arc chain) — at `PaymentFlow.tsx:117-129`. It **only** falls back to a server-side relayer (demo wallet `BUYER_PRIVATE_KEY`, `api/settle/route.ts`) in the catch block, and only on a genuine network/broadcast hiccup. Critically, the fallback is **fail-safe, not fail-open**: the `isRevert` guard (`PaymentFlow.tsx:134`) *refuses* to relay on revert/insufficient-funds/slippage/user-rejected, so a reverted tx can never be dressed up as success. When the relayer does run, the receipt says so verbatim: "Settled by: FractionPay relayer."

**Q: Your oracle staleness checks — do they actually fire?**
The checks are real and unit-tested against a separate `MockAggregator` (`test_staleFeedDoesNotBrickVault`, etc.). Honest caveat: our specific `YieldAggregator` RWA feeds always return `updatedAt = block.timestamp` and `answeredInRound = roundId = 1`, so *those* feeds are structurally always-fresh and can't trip the checks in this demo. The hardening matters the moment you wire a real Chainlink feed that *can* go stale — which is the production path.

**Q: Is the "6% property yield" actually accruing?**
No, and that's by design. The MNHTN property feed is `YieldAggregator(1000e8, 0, ...)` — `apyBps = 0`, flat $1,000/share, so its NAV contribution is static. Property yield is delivered through **`distributeDividends` in USDC**, not price accrual. The 6% (`annualYieldBps = 600`) is a dividend target / label, not a price curve. The dividend accounting (`PropertyToken.sol`) is the real mechanism.

**Q: How is liquidity in the vault real if no one's deposited?**
It's **seeded at deploy** (`DeployVault.s.sol:56-86`): 50k USDC LP + 25k EURC reserve + a buyer RWA basket of **TBILL/XAUM/MREIT ($50k/$30k/$120k)** + 100 MNHTN shares at a $10M valuation. (AAPL30 and MMF aren't in the deploy-seeded basket — they're minted to the wallet by the faucet at runtime.) That's so the demo has depth; the deposit/withdraw/pay code paths against it are real ERC-4626 logic.

**Q: What does the agent actually decide, and why trust it?**
`planLiquidation` is deterministic (`optimizer.ts:30-66`): among assets that can cover the payment, it sells the **lowest-yield** position first (tie-break: largest), preserving your best-compounding assets. In the default portfolio that's **XAUM (gold) at 0 bps** — the faucet even comments it's "the low-yield slice the agent spends." And the contract *measures* that decision — every `Settled` event emits `yieldPreservedPerYearUsd = USD × (maxHeldAPY − soldAPY)` (`FractionPayVault.sol:285-298`). The agent's edge isn't a claim; it's an on-chain number.

---

*Note: the agent identity is ERC-8004 **#6553 on Ethereum Sepolia** (register tx `0x9740542e…`, recorded in `.env:72`, verifiable at sepolia.etherscan.io). The served `agent-card.json` is now aligned to #6553 / `eip155:11155111`, so the card matches the rest of the app (`/optimize`, `/feedback`, the UI). The Arc track stands on the on-chain contracts in §6 above; the agent identity is cross-track supporting proof.*
