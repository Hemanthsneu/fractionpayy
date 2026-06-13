/**
 * FractionPay — Chainlink CRE workflow: payment orchestration.
 *
 * Orchestrates the off-chain legs of a FractionPay payment:
 *   1. (trigger) a payment is initiated for $amount to a merchant
 *   2. read the RWA price from the Chainlink feed on Arc (verifiable price)
 *   3. call the optimizer agent over HTTP (the x402-paywalled endpoint) to
 *      get the liquidation plan — verifiable AI reasoning off-chain
 *   4. report the plan back on-chain so settlement can execute
 *
 * This file expresses the orchestration. To run it:
 *   cd cre-workflow
 *   cre login                       # one-time, browser auth
 *   cre init --template http-fetch-ts   # generates exact SDK bindings
 *   cre workflow simulate settle    # local simulation
 *
 * Mirrors the CRE TypeScript hello-world + http-fetch templates.
 */
import { cre, type Runtime } from "@chainlink/cre-sdk";

const AGENT_ENDPOINT = "https://fractionpayy.vercel.app/api/optimize";

// Chainlink-compatible RWA price feeds on Arc (set at deploy).
const FEEDS = {
  TBILL: "0xf2CDA2580D7472138E721F40880551909514c42E",
  XAUM: "0x288c3361d370Fc5e21919A105eA12b4Db0d2BC86",
  MREIT: "0xF6926fBce62A62B25EE2C9c8B34a3970FD48132e",
} as const;

interface PaymentTrigger {
  amountUsd: number;
  merchant: string;
  positions: Array<{ symbol: string; valueUsd: number; yieldBps: number; priceUsd: number }>;
}

/** Step 2: read the live RWA price via the Chainlink feed (on-chain read). */
async function readPrice(runtime: Runtime, feed: string): Promise<number> {
  const evm = runtime.getEvmClient("arc-testnet");
  const { answer } = await evm.readContract({
    address: feed,
    function: "latestRoundData",
  });
  return Number(answer) / 1e8; // 8-decimal USD
}

/** Step 3: ask the optimizer agent for a liquidation plan (HTTP capability). */
async function askAgent(runtime: Runtime, payload: PaymentTrigger) {
  const res = await runtime.http.fetch(AGENT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amountUsd: payload.amountUsd, positions: payload.positions }),
  });
  return res.json();
}

export default cre.newWorkflow({
  name: "fractionpay-settle",
  // For the demo we trigger on a cadence; production would trigger on the
  // PaymentInitiated event from FractionPay.sol.
  triggers: [cre.cron({ schedule: "*/30 * * * * *" })],

  async handler(runtime: Runtime, trigger: PaymentTrigger) {
    runtime.log(`Orchestrating payment of $${trigger.amountUsd} to ${trigger.merchant}`);

    // 2. verifiable price for each held asset
    const prices: Record<string, number> = {};
    for (const [sym, feed] of Object.entries(FEEDS)) {
      prices[sym] = await readPrice(runtime, feed);
    }
    runtime.log(`Chainlink prices: ${JSON.stringify(prices)}`);

    // 3. hire the agent for the liquidation decision
    const plan = await askAgent(runtime, trigger);
    runtime.log(`Agent plan: sell ${plan?.plan?.symbol} (${plan?.plan?.reason})`);

    // 4. report the orchestrated plan on-chain for settlement
    return runtime.report({
      merchant: trigger.merchant,
      amountUsd: trigger.amountUsd,
      asset: plan?.plan?.symbol,
      sellAmount: plan?.plan?.sellAmount,
      pricesUsed: prices,
    });
  },
});
