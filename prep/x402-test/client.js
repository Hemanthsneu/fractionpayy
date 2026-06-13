/**
 * x402 prototype — CLIENT side (this is what FractionPay does).
 *
 * Calls the paywalled /optimize endpoint. x402-fetch intercepts the
 * HTTP 402, signs a USDC payment on Base Sepolia with BUYER_PRIVATE_KEY,
 * retries the request with the payment header, and returns the 200.
 *
 * Prereqs:
 *   1. Server running (npm run server)
 *   2. BUYER_PRIVATE_KEY wallet holds Base Sepolia USDC (Circle faucet)
 *      and a little Base Sepolia ETH for approvals.
 *
 * Run:  npm run client
 */
import "dotenv/config";
import { privateKeyToAccount } from "viem/accounts";
import { wrapFetchWithPayment } from "x402-fetch";

const pk = process.env.BUYER_PRIVATE_KEY;
if (!pk) {
  console.error("Set BUYER_PRIVATE_KEY in .env (testnet-only wallet, never reuse!)");
  process.exit(1);
}

const account = privateKeyToAccount(pk.startsWith("0x") ? pk : `0x${pk}`);
console.log(`Paying from: ${account.address}`);

const fetchWithPayment = wrapFetchWithPayment(fetch, account);

const res = await fetchWithPayment("http://localhost:4021/optimize", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    amountUsd: 6,
    portfolio: [
      { symbol: "MockRWA-TBILL", valueUsd: 50000, apy: 4.5 },
      { symbol: "MockRWA-GOLD", valueUsd: 30000, apy: 0 },
      { symbol: "MockRWA-REIT", valueUsd: 120000, apy: 6.1 },
    ],
  }),
});

console.log(`HTTP ${res.status}`);
console.log("Payment response header:", res.headers.get("x-payment-response"));
console.log("Body:", JSON.stringify(await res.json(), null, 2));
console.log("\n✅ If you see the plan above, the full 402 -> pay -> 200 loop works.");
