# FractionPay — Prep Status & Manual Tasks

> Generated 2026-06-12. Full plan: [../FRACTIONPAY_PLAN_V3.md](../FRACTIONPAY_PLAN_V3.md)

## ✅ Done (automated)

- [x] Foundry 1.7.1 installed (`~/.foundry/bin` — add to PATH in `~/.zshrc`)
- [x] Next.js app scaffolded → `app/` (TS, Tailwind, App Router, src-dir)
- [x] All sponsor SDKs installed in `app/` (Dynamic, Privy, World IDKit, ENS, LI.FI, x402, BigQuery, framer-motion, qrcode.react)
- [x] Foundry project → `contracts/` with Chainlink + OpenZeppelin libs
- [x] x402 prototype → `prep/x402-test/` (server + client, ready to run)
- [x] BigQuery exploration SQL → `prep/bigquery/erc8004-explore.sql` (real addresses + topic hashes baked in)
- [x] ERC-8004 registry addresses + event hashes captured → `prep/bigquery/README.md`
- [x] Agent card draft → `prep/agent-card.json`
- [x] Master env template → `.env.example`

## ☐ YOUR manual tasks (can't be automated — accounts need a human)

### Accounts & keys (slowest first)
- [ ] **Uniswap API key** — developer.uniswap.org (may have approval delay — do TODAY)
- [ ] **GCP project** — console.cloud.google.com → enable BigQuery → run Query 1 from `prep/bigquery/erc8004-explore.sql` → create service account → download JSON key
- [ ] Circle dev account — developers.circle.com (Arc testnet access + USDC faucets)
- [ ] LI.FI Composer API key — li.fi/sdk
- [ ] Dynamic — dashboard.dynamic.xyz (environment ID)
- [ ] Privy — dashboard.privy.io (app ID + try the Agent Wallet CLI once)
- [ ] World — developer.worldcoin.org (app ID + action)
- [ ] Chainlink CRE CLI — docs.chain.link/cre (install + run one simulation)
- [ ] Vercel account + decide domain (`pay.fractionpay.xyz` → buy fractionpay.xyz, or use `*.vercel.app` for free and re-program NFC cards accordingly)

### Wallets & tokens
- [ ] Create 4 testnet-only wallets (buyer / coffeeshop / supplier / agent) — `cast wallet new` ×4
- [ ] Base Sepolia ETH → all 4 (faucets; more at ETHGlobal venue)
- [ ] **Base Sepolia USDC → buyer wallet** (faucet.circle.com) ← x402 needs this!
- [ ] Arc testnet USDC + gas → deployer & buyer
- [ ] Fill in `.env.example` → `.env` as you go

### x402 dry run (after wallets funded)
```bash
cd prep/x402-test
npm install
cp .env.example .env   # fill in AGENT_WALLET_ADDRESS + BUYER_PRIVATE_KEY
npm run server         # terminal 1
npm run client         # terminal 2 → expect HTTP 402 → payment → 200 + plan
```

### NFC cards (after domain decided)
- [ ] Program 3 cards (NFC Tools app, NDEF URL record):
  - `https://<domain>/pay/coffeeshop.eth`
  - `https://<domain>/pay/supplier.eth`
  - `https://<domain>/pay/charity.eth`
- [ ] Print 3 matching QR cards (backup)
- [ ] Test every card + QR on your phone

### ENS (needs a little real ETH or do on testnet)
- [ ] Decide: register `fractionpay.eth` on mainnet (~$5/yr + gas) or use Sepolia ENS for demo
- [ ] Plan subnames: `optimizer.fractionpay.eth` + merchant test names

### Verification (1 hour, high value)
- [x] ✅ Etherscan → Identity Registry `0x8004A169...a432` → **VERIFIED 2026-06-12**
  - Contract is verified, named `AgentIdentity`, 16,119 txs
  - `Registered` topic0 = `0xca52e62c...bc4a` — **MATCHES** (confirmed via `cast sig-event` + live `cast logs`)
  - `MetadataSet` topic0 = `0x2c149ed5...468b` — **MATCHES** (seen on-chain)
  - `NewFeedback` topic0 = `0x6a4a6174...febc` — **MATCHES** (live feedback data visible on Reputation Registry, incl. "starred" feedback strings)
  - **Bonus**: Registration txs emit 4 events total. A richer event `0x3a2c7fff...` carries indexed (agentId, owner) + full ABI-encoded agentURI in data — useful for BigQuery if you want to decode URIs directly
- [ ] Run BigQuery Query 1 — should show ~45k+ registrations since 2026-01
- [ ] Read the LI.FI Composer quickstart + Chainlink CRE getting-started end to end

## Key reference values

| Thing | Value |
|---|---|
| ERC-8004 Identity (mainnets) | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |
| ERC-8004 Reputation (mainnets) | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |
| ERC-8004 Identity (Base Sepolia) | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| ERC-8004 Reputation (Base Sepolia) | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |
| x402 facilitator (testnet, free) | `https://x402.org/facilitator` |
| BigQuery dataset | `bigquery-public-data.crypto_ethereum.logs` |
| ETHGlobal rule | Code written AT event; accounts/keys/learning/scaffolds OK prep-week |
