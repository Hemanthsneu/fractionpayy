# FractionPay × Chainlink CRE

A CRE workflow that orchestrates the off-chain legs of a payment: read the
Chainlink RWA price feed → call the optimizer agent (HTTP) → report the plan
on-chain for settlement.

## Status
`workflow.ts` expresses the orchestration logic. Generating the exact SDK
bindings + simulating requires authentication (CRE is auth-gated):

```bash
cd cre-workflow
cre login                              # one-time browser auth
cre init --template http-fetch-ts      # scaffolds package + project.yaml + bindings
# merge workflow.ts logic into the generated handler
cre workflow simulate fractionpay-settle
```

## Why CRE fits FractionPay
- **Orchestration**: one workflow coordinates price → agent → settle, instead of
  the frontend stitching calls together.
- **Verifiable price**: reads the same Chainlink feed the contract uses.
- **Verifiable AI reasoning**: the agent call is an auditable workflow step — a
  natural home for the Confidential AI Attester to sign the optimizer's output.

## Capabilities used
- `cron` trigger (demo) / `evm log` trigger (production: PaymentInitiated)
- `evm` read — Chainlink `latestRoundData()` on Arc
- `http` — POST to the x402 agent endpoint
- `report` — write the orchestrated plan on-chain
