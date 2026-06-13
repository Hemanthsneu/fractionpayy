# ENS Setup — fractionpay.eth subnames (~10 min, MetaMask + mainnet gas)

You own `fractionpay.eth` (registered to 0xce22e02b...7C26). We need 4 subnames.
Total cost: ~$5-15 in mainnet gas depending on prices. Do at app.ens.domains
with the OWNING MetaMask account connected, Ethereum mainnet.

## 1. Create subnames
For each of: `coffeeshop`, `supplier`, `charity`, `optimizer`

1. app.ens.domains → search `fractionpay.eth` → **Subnames** tab → **New subname**
2. Enter the label (e.g. `coffeeshop`) → Create (tx)

## 2. Set the address record on each subname (CRITICAL — this is what resolves)
After creating each subname → open it → **Records** → Edit → ETH address:

| Subname | ETH address record |
|---|---|
| coffeeshop.fractionpay.eth | `0x24f098DD3a7260DCcfdD9D74714289B9131DD745` |
| supplier.fractionpay.eth | `0xfb98F38B40751422356f5eEa6bBB663831fd5E04` |
| charity.fractionpay.eth | `0xfb98F38B40751422356f5eEa6bBB663831fd5E04` |
| optimizer.fractionpay.eth | `0x69C4b79F998e92267f116f12A3D9764ac77b8F30` |

## 3. Text records (do in the SAME edit tx to save gas)
On coffeeshop.fractionpay.eth add text records:
- `fractionpay.name` = `Brooklyn Coffee Co.`
- `fractionpay.tokens` = `USDC`
- `fractionpay.chain` = `arc-testnet`

On supplier.fractionpay.eth:
- `fractionpay.name` = `Atlas Supply GmbH`
- `fractionpay.tokens` = `USDC,EURC`
- `fractionpay.chain` = `arc-testnet`

On charity.fractionpay.eth:
- `fractionpay.name` = `Clean Water Fund`
- `fractionpay.tokens` = `USDC`
- `fractionpay.chain` = `arc-testnet`

On optimizer.fractionpay.eth:
- `url` = `https://fractionpayy.vercel.app/.well-known/agent-card.json`
- `description` = `ERC-8004 agent #7031 — RWA liquidation optimizer, x402-paywalled`

## 4. Gas-saving tips
- Batch records per name in one edit (the app combines into one tx)
- Do it when gas is low (late US night / weekend): check etherscan.io/gastracker
- If gas is brutal: do ONLY coffeeshop + optimizer (the two used live on stage);
  the app's fallback registry covers the rest

## Why this matters for judging
- The payment page badge flips from "registry" to "✓ resolved via ENS" — live
  mainnet resolution on stage
- The NFC card URL contains a REAL ENS name resolvable in any wallet
- optimizer.fractionpay.eth → agent card → x402 endpoint = the ENS AI-agents
  track story ("the agent's identity IS an ENS name")
