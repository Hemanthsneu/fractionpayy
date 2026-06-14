// Transfer Ownable ownership of the Arc contracts (vault, market, property)
// to the issuer wallet so the admin can tokenize/register/list wallet-side.
// Run from the app dir so viem resolves:  (cd app && node ../scripts/transfer-ownership.mjs)
import { createWalletClient, createPublicClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].split(" #")[0].trim();
  }
}
const here = path.dirname(fileURLToPath(import.meta.url));
loadEnv(path.join(here, "..", "app", ".env.local"));
loadEnv(path.join(here, "..", ".env"));

const NEW_OWNER = process.env.NEW_OWNER || "0xce22e02b82a20bE9c59dc11161778469B2Bf7C26";
const arc = {
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
};
const abi = parseAbi([
  "function owner() view returns (address)",
  "function transferOwnership(address newOwner)",
]);
const contracts = {
  vault: "0x3FbE9FA34858Af481625849144fA14726E25670f",
  market: "0xB3624f299fb080c36c9535CA1C270c08b5d95390",
  property: "0x805F070884DF5d83B669EbDceA2C16A68954976f",
};

const pub = createPublicClient({ chain: arc, transport: http() });
const account = privateKeyToAccount(process.env.BUYER_PRIVATE_KEY);
const wallet = createWalletClient({ account, chain: arc, transport: http() });
console.log("signer (current owner):", account.address, "→ new owner:", NEW_OWNER);

for (const [name, address] of Object.entries(contracts)) {
  const owner = await pub.readContract({ address, abi, functionName: "owner" });
  if (owner.toLowerCase() === NEW_OWNER.toLowerCase()) {
    console.log(`${name}: already owned by ${NEW_OWNER} ✓`);
    continue;
  }
  if (owner.toLowerCase() !== account.address.toLowerCase()) {
    console.log(`${name}: SKIP — owned by ${owner}, not the signer`);
    continue;
  }
  const hash = await wallet.writeContract({ address, abi, functionName: "transferOwnership", args: [NEW_OWNER] });
  await pub.waitForTransactionReceipt({ hash });
  const now = await pub.readContract({ address, abi, functionName: "owner" });
  console.log(`${name}: transferred → ${now}  (tx ${hash})`);
}
console.log("done.");
