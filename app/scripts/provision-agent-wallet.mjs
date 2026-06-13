/**
 * Provision the optimizer agent's treasury as a Privy server wallet.
 * The agent (ERC-8004 #7031) earns its x402 fees into THIS wallet — a
 * Privy-managed account, not a raw burner. Reproducible artifact.
 *
 *   node scripts/provision-agent-wallet.mjs
 */
const APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const SECRET = process.env.PRIVY_APP_SECRET;
if (!APP_ID || !SECRET) throw new Error("set NEXT_PUBLIC_PRIVY_APP_ID + PRIVY_APP_SECRET");

const res = await fetch("https://api.privy.io/v1/wallets", {
  method: "POST",
  headers: {
    Authorization: "Basic " + Buffer.from(`${APP_ID}:${SECRET}`).toString("base64"),
    "privy-app-id": APP_ID,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ chain_type: "ethereum" }),
});
const w = await res.json();
console.log("Privy agent treasury wallet:");
console.log("  address:", w.address);
console.log("  walletId:", w.id);
console.log("Set AGENT_WALLET_ADDRESS to this address (x402 payTo).");
