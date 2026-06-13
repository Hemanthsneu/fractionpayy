/**
 * x402 prototype — SERVER side.
 *
 * An Express server with one x402-paywalled endpoint: POST /optimize.
 * This is a throwaway prep-week prototype to verify the 402 -> pay -> 200
 * loop works end-to-end on Base Sepolia BEFORE the hackathon.
 * (Rebuild the real version inside the Next.js app at the event.)
 *
 * Run:  npm run server
 */
import "dotenv/config";
import express from "express";
import { paymentMiddleware } from "x402-express";

const PAY_TO = process.env.AGENT_WALLET_ADDRESS; // agent's receiving wallet
const FACILITATOR_URL = "https://x402.org/facilitator"; // free public testnet facilitator

if (!PAY_TO) {
  console.error("Set AGENT_WALLET_ADDRESS in .env (the wallet that receives x402 fees)");
  process.exit(1);
}

const app = express();
app.use(express.json());

// Everything below this middleware returns HTTP 402 until paid.
app.use(
  paymentMiddleware(
    PAY_TO,
    {
      "POST /optimize": {
        price: "$0.001", // a tenth of a cent, settled in USDC
        network: "base-sepolia",
      },
    },
    { url: FACILITATOR_URL }
  )
);

// The "AI optimizer agent" — at the event this becomes the real
// liquidation planner. For the prototype it returns a canned plan.
app.post("/optimize", (req, res) => {
  const { amountUsd = 6, portfolio = [] } = req.body ?? {};
  res.json({
    agent: "optimizer.fractionpay.eth",
    plan: {
      asset: "MockRWA-TBILL",
      sellPercent: ((amountUsd / 50000) * 100).toFixed(4),
      reason: "Lowest yield disruption: T-bill position is largest and most liquid.",
      amountUsd,
    },
    paidVia: "x402",
  });
});

const PORT = process.env.PORT || 4021;
app.listen(PORT, () => {
  console.log(`x402 agent server on http://localhost:${PORT}`);
  console.log(`Paywalled endpoint: POST /optimize ($0.001 USDC, base-sepolia)`);
  console.log(`Fees paid to: ${PAY_TO}`);
});
