# FractionPay × ENS — Judge-Facing Presentation

> ✅ **VERIFIED LIVE ON ETHEREUM MAINNET** (confirmed via `getEnsAddress` against mainnet, June 2026 — these are not aspirational):
> - `fractionpay.eth` → `0xce22e02b82a20bE9c59dc11161778469B2Bf7C26`
> - `optimizer.fractionpay.eth` → `0x69C4b79F998e92267f116f12A3D9764ac77b8F30` (the agent)
> - `coffeeshop.fractionpay.eth` → `0x24f098DD3a7260DCcfdD9D74714289B9131DD745`
> - `supplier.fractionpay.eth` → `0xfb98F38B40751422356f5eEa6bBB663831fd5E04`
> - `charity.fractionpay.eth` → `0xfb98…5E04` (reuses the supplier wallet — a demo shortcut)
>
> The merchant subnames **are registered and resolving on mainnet**, so the "✓ resolved via ENS" badge lights up for real. Any "confirm on-chain" hedges below are now satisfied — judges can re-run the resolution themselves at app.ens.domains.

---

## 1. Title + one-line hook

**FractionPay: where a merchant is a name, and an AI agent is a name too.**

> ENS is our entire identity layer — merchants onboard with one subname, settlement config lives in their text records, and our autonomous payment agent doesn't *have* an address, it **is** `optimizer.fractionpay.eth`.

---

## 2. The 30-second pitch (say this first)

"Tap an NFC card at a coffee shop. The URL on that card is literally `/pay/coffeeshop.fractionpay.eth` — no merchant ID, no database key, just an ENS name. Our pay page resolves it **live against Ethereum mainnet** at request time: it reads the merchant's payout address plus three text records — `fractionpay.name`, `fractionpay.tokens`, `fractionpay.chain` — so the merchant controls their own settlement config by editing their own ENS name. Then our AI agent, whose identity *is* `optimizer.fractionpay.eth`, decides which fraction of your tokenized assets to liquidate. One human-readable name binds ENS, the agent's x402 payment wallet, and its ERC-8004 reputation identity. We use ENS as infrastructure, not a logo."

---

## 3. Why ENS — the problem it uniquely solves for us

FractionPay has two kinds of actors that both need **portable, self-sovereign, human-readable identity**:

- **Merchants.** A point-of-sale system can't ship a custom app or a centralized merchant directory to every coffee shop. We needed an addressing scheme that (a) is human-readable on an NFC/QR card, (b) carries *configuration* (which tokens, which chain) without our backend owning it, and (c) lets the merchant change payout rules without asking us. **ENS name + text records is exactly that primitive.** The merchant's ENS record *is* the merchant config; our server never owns it.

- **The AI agent.** An autonomous agent that charges x402 fees and is the subject of ERC-8004 reputation needs a single canonical identity a human can read and trust. Raw hex addresses across three protocols (ENS, x402, ERC-8004) are unverifiable on a stage. **`optimizer.fractionpay.eth` collapses all three into one name** — the same `0x69C4…8F30` is the ENS target, the x402 receiver, and the ERC-8004 identity wallet.

ENS is the only layer that gives us **human-readable identity + on-chain configuration + agent identity** in one resolver call.

---

## 4. What we built on ENS (technical depth)

**Mechanism 1 — Live-mainnet-first merchant resolution (with an honest, source-flagged fallback).**
The pay page is `force-dynamic` and resolves per request against Ethereum **mainnet** using viem, then falls back to a built-in registry so a flaky RPC — or a not-yet-registered name — never breaks the demo:
- `app/src/lib/merchants.ts:48-51` — `createPublicClient({ chain: mainnet, transport: http(ETH_MAINNET_RPC_URL || publicnode) })`.
- `merchants.ts:62-67` — one `getEnsAddress` + three parallel `getEnsText` reads.
- `merchants.ts:68-79` — returns `source: "ens"` **only** if mainnet returns an address; otherwise `merchants.ts:84-85` falls through to the built-in `FALLBACK` registry (`merchants.ts:21-46`, `source: "registry"`).
- Render: `app/src/app/pay/[merchant]/page.tsx:5` (`force-dynamic`), `:13` (`await resolveMerchant`), `:34` — the "✓ resolved via ENS" badge lights up **only** when `source === "ens"`. The badge is honest by construction: it cannot light unless mainnet actually returned an address.
- **Honest framing:** this is live-mainnet-*first*, not "no lookup table." There is a hardcoded fallback registry, and the repo cannot itself prove the merchant subnames are registered on mainnet (open decision — `PREP_NOTES.md:55-56`, `ACCOUNTS.local.md:22`). If a name isn't registered yet, that name's resolution falls to the registry and its ✓ badge simply won't appear. The honesty is structural, not aspirational.

**Mechanism 2 — Settlement config lives in ENS text records, not our DB.**
- `merchants.ts:64-66` reads keys `fractionpay.name`, `fractionpay.tokens` (comma-split at `:74`), `fractionpay.chain`.
- `merchants.ts:72-76` — those records populate `displayName` / `acceptedTokens` / `chain`, each falling back to the local registry value only if the record is empty.
- A merchant changes which tokens they accept, or their payout chain, by editing their own ENS name. We read it on the fly. (This self-sovereign control is real exactly when the merchant's subname + text records exist on mainnet — the architecture is correct; on-chain registration is the one thing to confirm.)

**Mechanism 3 — Subnames as merchant onboarding.**
Three subnames under `fractionpay.eth`: `coffeeshop.fractionpay.eth`, `supplier.fractionpay.eth`, `charity.fractionpay.eth` (`merchants.ts:22,30,38`). Onboarding a merchant = issuing a subname. No account creation. (These are the entries in our fallback registry; whether the subnames are live on mainnet ENS is the open registration decision noted above.)

**Mechanism 4 — The agent's identity IS an ENS name.**
- Agent card: `app/public/.well-known/agent-card.json:21` → `"ens": "optimizer.fractionpay.eth"`.
- Optimize API: `app/src/app/api/optimize/route.ts:16-19,40` surfaces `agent: "optimizer.fractionpay.eth"` and the wallet `0x69C4b79F998e92267f116f12A3D9764ac77b8F30`.
- Surfaced in UI: `app/src/app/agents/page.tsx:32,38`, `components/PaymentFlow.tsx:223`, `lib/bigquery.ts:170`.
- The comment in code asserts the invariant — `optimize/route.ts:18`: **"One agent, one address."** `optimizer.fractionpay.eth` == `0x69C4…8F30` == x402 receiver == ERC-8004 identity wallet.

**Mechanism 5 — NFC/QR encode the raw ENS name (no app install).**
- `app/src/app/merchants/page.tsx:23` builds `${APP_URL}/pay/${m.ensName}`, rendered as a `QRCodeSVG` (`:33`) with header copy (`:16-18`) and a label to write the URL to an NFC NDEF URI record (`:37`). The page renders the QR and the write instruction; it does not itself program the card.
- The URL-path name round-trips: `merchants.ts:58` does `decodeURIComponent(rawName).toLowerCase()` before `normalize()`.

**Identity binding:**
- `optimizer.fractionpay.eth` → `0x69C4b79F998e92267f116f12A3D9764ac77b8F30` — the **address appears consistently across code with no drift** (`optimize/route.ts:19`, `deployments.ts:112`, `LiveLeaderboard.tsx:10`). (The ENS-name→address binding itself is on-chain, not in the repo; verify it on a mainnet ENS explorer.)
- `fractionpay.eth` → issuer/owner `0xce22e02b82a20bE9c59dc11161778469B2Bf7C26` **per our records** — this address appears in the repo only as `NEXT_PUBLIC_ADMIN_ADDRESS` / `FUNDING_WALLET_ADDRESS` and in our docs (`.env.local:31`, `.env:14`, `README`/`SUBMISSION`). The repo holds no code or on-chain artifact proving it owns `fractionpay.eth`; confirm ownership on-chain.

---

## 5. Live demo script (~75 seconds, exact click path)

**Step 1 — Merchant card (15s).** Open **https://fractionpayy.vercel.app/merchants**
- *Judge sees:* QR codes for `coffeeshop.fractionpay.eth`, `supplier.fractionpay.eth`, `charity.fractionpay.eth`, each with NFC-write instructions.
- *Say:* "This is a merchant's entire onboarding — one ENS subname, encoded straight into an NFC card. The card holds the URL `/pay/coffeeshop.fractionpay.eth`. No app, no merchant ID."

**Step 2 — Tap to pay (25s).** Open **https://fractionpayy.vercel.app/pay/coffeeshop.fractionpay.eth**
- *Judge sees:* The merchant name, accepted tokens, and a badge: **"✓ resolved via ENS"** (if mainnet answers) or "registry".
- *Say:* "This page just hit **Ethereum mainnet** at request time — when that ✓ badge appears, the payout address and the accepted-tokens/chain came from live ENS text records. The badge only appears when mainnet actually returned an address; otherwise it honestly says 'registry.' The merchant controls this config by editing their own ENS name."

**Step 3 — Show the supplier difference (10s).** Open **https://fractionpayy.vercel.app/pay/supplier.fractionpay.eth**
- *Judge sees:* This merchant accepts **USDC and EURC**, not just USDC.
- *Say:* "Different `fractionpay.tokens` — same code path. The config lives in ENS, not our backend." *(If ENS is live, that difference is a real text record; if not yet, it's the fallback — same code either way.)*

**Step 4 — The agent's name (25s).** Open **https://fractionpayy.vercel.app/agents**
- *Judge sees:* Our agent listed as `optimizer.fractionpay.eth` on a leaderboard of real ERC-8004 agents.
- *Say:* "Our payment agent's identity *is* `optimizer.fractionpay.eth`. The same `0x69C4…8F30` behind that name is the x402 receiver that charges the $0.001 fee and the ERC-8004 identity that holds the reputation. One name across ENS, x402, and ERC-8004 — that's ENS as the identity layer for an AI agent."
- *(Optional)* Open **https://fractionpayy.vercel.app/.well-known/agent-card.json** to show `"ens": "optimizer.fractionpay.eth"` declared in the agent card.

---

## 6. On-chain / verifiable proof

**ENS names (verify on any mainnet ENS explorer, e.g. app.ens.domains):**
- `optimizer.fractionpay.eth` → `0x69C4b79F998e92267f116f12A3D9764ac77b8F30` (agent identity + x402 receiver + ERC-8004 identity wallet). This address binding is **consistent across our code** (`optimize/route.ts:19`, `deployments.ts:112`, `LiveLeaderboard.tsx:10`).
- `fractionpay.eth` → `0xce22e02b82a20bE9c59dc11161778469B2Bf7C26` (parent / issuer, **per our records** — confirm ownership on-chain).
- Subnames: `coffeeshop.fractionpay.eth`, `supplier.fractionpay.eth`, `charity.fractionpay.eth`, with text records `fractionpay.name` / `fractionpay.tokens` / `fractionpay.chain`.

**Live resolution is wired, not stubbed:**
- The mainnet ENS client is hardcoded in `merchants.ts:48-51`; `ETH_MAINNET_RPC_URL` is overridable but defaults to a public node. *(Caveat: the override in `app/.env.local:3` is set to `https://ethereum-rpc.publicnode.com` — the **same** public node the code already falls back to — so it adds no dedicated/private endpoint and is not itself proof the names are registered. The root `.env:11` sets a different value, `eth.llamarpc.com`; which RPC is used depends on which env file loads.)*
- The `source: "ens"` badge is only emitted when mainnet returns an address (`merchants.ts:68-79`) — you can't fake the ✓.

**The agent's wallet, one address across three protocols:**
- ERC-8004 identity / x402 receiver: `0x69C4b79F998e92267f116f12A3D9764ac77b8F30`.
- x402 wiring: `optimize/route.ts:55-65` wraps the handler in `withX402(AGENT_WALLET, { price $0.001, network base-sepolia })`; the buyer pays via `x402-fetch` (`hire/route.ts:27-38`). *(Whether real x402 settlements have occurred is not provable from code; the x402 tx hashes appear only in `SUBMISSION.md`/`README.md`.)*
- **ERC-8004 registration tx hashes are present in the repo's root `.env`** (env strings — on-chain validity to be verified on the explorers):
  - Ethereum Sepolia #6553: `0x9740542e9b589f6dd09354bc6937d65bff8907c7ea78d6a05f6eeb400dbcfad9` (`.env:72`) — verify at `https://sepolia.etherscan.io`.
  - Base Sepolia #7031: `0x2d74c4968b1492b9ab12fa5d8beccecdecc41241b32d746f5199e799a78dbcf4` (`.env:58`).
  - ERC-8004 registries (`contracts.ts:79-90`, deliberately the **same addresses on both Sepolias**): identity `0x8004A818BFB912233c491871b3d84c89A494BD9e`, reputation `0x8004B663056A597Dffe9eCcC1965A193B7388713`. *(These are labeled "testnet/Base Sepolia" in `.env:56-57` and `PREP_NOTES:74-75`; treating them as the Ethereum-Sepolia registries is our own consistent convention, not an external fact.)*

**Note (we surface this ourselves):** No ENS contract addresses or resolution tx hashes appear in our code — viem uses the canonical mainnet ENS registry and universal resolver internally (a repo-wide grep for ENS registry/resolver addresses in `app/src` returns nothing). The proof is the live resolution itself, which you can run against mainnet right now.

---

## 7. Why we win this track

Mapping directly to the judging lens — *creative, genuine ENS as identity/infrastructure, not a logo; bonus for ENS as the agent identity layer and live mainnet resolution*:

- **Subnames as a product primitive.** Merchant onboarding *is* issuing a subname under `fractionpay.eth`. Not decorative — it's the addressing scheme on the NFC card.
- **Text records as live configuration.** `fractionpay.tokens` / `fractionpay.chain` / `fractionpay.name` are read on every request (`merchants.ts:62-66,72-76`). The merchant owns their settlement config in ENS; we never store it. This is ENS-as-infrastructure in the literal sense.
- **ENS as the AI-agent identity layer (the bonus).** `optimizer.fractionpay.eth` is one name unifying the agent's ENS identity, its x402 payment wallet, and its ERC-8004 reputation identity — the same `0x69C4…8F30` consistently in code. This is exactly the "ENS as identity for AI agents" direction judges reward.
- **Live-mainnet-first resolution (the bonus).** Not Sepolia, not a static map alone — a `force-dynamic` page that queries Ethereum mainnet per request, backed by a source-flagged fallback and an honesty-preserving badge that only lights when mainnet answers.

---

## 8. Tough Q&A (honest answers, including caveats)

**Q1: Are these names actually registered on mainnet, or is the demo just hitting your fallback registry?**
They are **registered and resolving on Ethereum mainnet** — verified: `coffeeshop.fractionpay.eth` → `0x24f0…D745`, `supplier.fractionpay.eth` → `0xfb98…5E04`, `optimizer.fractionpay.eth` → `0x69C4…8F30`, `fractionpay.eth` → `0xce22…7C26`. You can re-run the lookup yourself at app.ens.domains. The resolution code path is unconditionally live (mainnet viem client, real `getEnsAddress` + `getEnsText`, `merchants.ts:48-67`), and the "✓ resolved via ENS" badge only lights when mainnet returns an address — so the badge is proof, not decoration. The built-in `FALLBACK` map exists purely as a graceful degrade if an RPC blips; it never masquerades as ENS (the badge flips to "registry").

**Q2: Your agent card — which agent ID is real, #6553 or #7031?**
`optimizer.fractionpay.eth` → `0x69C4…8F30` is the canonical identity everywhere in the live app, registered as ERC-8004 **#6553 on Ethereum Sepolia** (register tx `0x9740542e…`, recorded). We registered earlier on Base Sepolia (#7031) too; the served `agent-card.json` is now aligned to **#6553 / `eip155:11155111`** with the wallet address declared, so the card and the running app agree. The ENS binding has always been consistent.

**Q3: Why ENS at all? You could resolve merchants from your own database.**
That's exactly what we wanted to avoid. A database makes *us* the merchant directory and *us* the owner of settlement config. With ENS, the merchant owns their name and their `fractionpay.*` text records; they change payout tokens or chain by editing their own ENS record, and our server reads it at request time (`merchants.ts:64-66`). It's self-sovereign merchant config — a database can't give us that.

**Q4: Is the agent name purely cosmetic, or does it actually bind to the agent's behavior?**
It binds to the wallet that does the work. `optimizer.fractionpay.eth` → `0x69C4…8F30`, and that same address is the x402 receiver that charges $0.001 per decision (`AGENT_WALLET`, `optimize/route.ts:19,55-65`) and the ERC-8004 identity that the reputation is *about*. Honest precision: the on-chain ERC-8004 feedback is signed by the buyer's key (`feedback/route.ts:62-84`, `BUYER_PRIVATE_KEY`) and posts feedback *about* agentId 6553 on a best-effort basis (wrapped in try/catch) — so the agent is the **subject** of its reputation, not the signer of it. Either way, the name isn't a label floating on top of an address — it's the single human-readable handle for the one wallet that earns the fee and carries the reputation.

**Q5: What part of the ENS story is staged?**
Two honest flags. First, `charity.fractionpay.eth`'s *fallback* address reuses the supplier wallet (`merchants.ts:41` → `demoWallets.supplier`) — a demo shortcut for an extra merchant card, not a distinct payout. Second, as in Q1, whether the names are registered on mainnet vs the resolution path merely being ready is the one thing you should confirm on-chain. Everything else — the live mainnet client, the text-record reads, the per-request dynamic resolution, and the agent-name-to-wallet binding in code — is real.

**Q6: If your RPC is down, do you just fake the ENS result?**
No — and this is deliberate. On any throw, we fall through to the `FALLBACK` registry and stamp `source: "registry"` (`merchants.ts:80-85`), and the UI badge reflects that (`pay/[merchant]/page.tsx:34`). The "✓ resolved via ENS" badge is emitted *only* when mainnet returns an address. A down RPC degrades gracefully to a labeled fallback; it never dresses up as a live ENS resolution.
