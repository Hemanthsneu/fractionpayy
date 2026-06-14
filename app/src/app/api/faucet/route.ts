/**
 * Demo faucet — funds a CONNECTED wallet so it can transact wallet-side on Arc.
 *
 * Arc uses USDC as its NATIVE gas token, so a fresh wallet can't sign anything
 * until it has native USDC. This endpoint (server-signed by the funded treasury
 * wallet) bootstraps any address with everything it needs to drive the real
 * wallet-side flow itself:
 *   1. native Arc USDC      → gas to sign approve/invest/pay/claim
 *   2. ERC-20 MockUSDC      → to invest in the marketplace
 *   3. a starter RWA basket → an instant portfolio + something to spend
 *   4. property shares      → so it can claim real USDC dividends
 *
 * After this one server tx batch, EVERY subsequent action is signed by the
 * visitor's own wallet — real self-custody, not a server shadow wallet.
 */
import { NextRequest, NextResponse } from "next/server";
import {
  createWalletClient,
  createPublicClient,
  http,
  parseEther,
  parseUnits,
  formatEther,
  isAddress,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet } from "@/lib/chains";
import { deployments } from "@/lib/deployments";
import { erc20Abi } from "@/lib/contracts";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const pub = createPublicClient({ chain: arcTestnet, transport: http() });

// Native Arc gas (USDC, 18-dec) to top a wallet up to. Enough for many txs.
const GAS_TARGET = parseEther("1.5");
const GAS_TOPUP = parseEther("2");
const USDC_GRANT = parseUnits("50000", 6); // 50k test USDC to invest with

// Starter RWA basket (18-dec share tokens) — gives an instant, spendable portfolio.
// Includes a 0%-yield asset (gold) so the optimizer has the "right" slice to sell.
const RWA_GRANT: Record<string, bigint> = {
  TBILL: parseUnits("20", 18), // ~$2,000
  XAUM: parseUnits("2", 18), // ~$4,800 (the low-yield slice the agent spends)
  MREIT: parseUnits("40", 18), // ~$2,000
  AAPL30: parseUnits("20", 18),
  MMF: parseUnits("20", 18),
};
const PROPERTY_GRANT = parseUnits("10", 18); // 10 Manhattan Office Tower shares

export async function POST(request: NextRequest) {
  const { address } = await request.json().catch(() => ({}));
  if (!isAddress(address)) {
    return NextResponse.json({ error: "valid address required" }, { status: 400 });
  }
  const to = address as Address;

  const pk = process.env.BUYER_PRIVATE_KEY;
  if (!pk) return NextResponse.json({ error: "faucet wallet not configured" }, { status: 500 });

  const dep = deployments.arcTestnet;
  const account = privateKeyToAccount(pk as `0x${string}`);
  const wallet = createWalletClient({ account, chain: arcTestnet, transport: http() });

  const txs: Record<string, string> = {};
  try {
    // Arc's RPC lags on pending-nonce, so back-to-back txs race and get
    // rejected ("invalid params"). Manage the nonce explicitly and confirm
    // all receipts at the end — fast and race-free.
    let nonce = await pub.getTransactionCount({ address: account.address });
    const hashes: `0x${string}`[] = [];

    // 1. native Arc gas (USDC) — only top up if the wallet is low on gas.
    const nativeBal = await pub.getBalance({ address: to });
    if (nativeBal < GAS_TARGET) {
      const gasTx = await wallet.sendTransaction({ to, value: GAS_TOPUP, nonce });
      txs.gas = gasTx;
      hashes.push(gasTx);
      nonce++;
    }

    // 2. ERC-20 test USDC (public mint).
    const usdcTx = await wallet.writeContract({ address: dep.usdc, abi: erc20Abi, functionName: "mint", args: [to, USDC_GRANT], nonce });
    txs.usdc = usdcTx;
    hashes.push(usdcTx);
    nonce++;

    // 3. starter RWA basket (public mint on each share token).
    for (const rwa of dep.rwas) {
      const amt = RWA_GRANT[rwa.symbol];
      if (!amt) continue;
      const t = await wallet.writeContract({ address: rwa.token, abi: erc20Abi, functionName: "mint", args: [to, amt], nonce });
      txs[rwa.symbol] = t;
      hashes.push(t);
      nonce++;
    }

    // 4. property shares — try multiple strategies to get shares to the wallet.
    // NON-FATAL: if all fail, skip. The core invest/pay demo doesn't need property.
    let propGranted = false;

    // Strategy A: issueShares (owner-only mint on PropertyToken)
    if (!propGranted) {
      try {
        const propTx = await wallet.writeContract({
          address: dep.property,
          abi: [{
            type: "function",
            name: "issueShares",
            inputs: [
              { name: "investor", type: "address" },
              { name: "shares", type: "uint256" },
            ],
            outputs: [],
            stateMutability: "nonpayable",
          }],
          functionName: "issueShares",
          args: [to, PROPERTY_GRANT],
          nonce,
        });
        txs.property = propTx;
        hashes.push(propTx);
        nonce++;
        propGranted = true;
      } catch { /* issueShares not authorized or reverted */ }
    }

    // Strategy B: public mint (same as other testnet tokens)
    if (!propGranted) {
      try {
        const propTx = await wallet.writeContract({
          address: dep.property, abi: erc20Abi, functionName: "mint", args: [to, PROPERTY_GRANT], nonce,
        });
        txs.property = propTx;
        hashes.push(propTx);
        nonce++;
        propGranted = true;
      } catch { /* mint not available on this contract */ }
    }

    // Strategy C: transfer from treasury balance
    if (!propGranted) {
      try {
        const propBal = (await pub.readContract({ address: dep.property, abi: erc20Abi, functionName: "balanceOf", args: [account.address] })) as bigint;
        if (propBal >= PROPERTY_GRANT) {
          const propTx = await wallet.writeContract({ address: dep.property, abi: erc20Abi, functionName: "transfer", args: [to, PROPERTY_GRANT], nonce });
          txs.property = propTx;
          hashes.push(propTx);
          nonce++;
          propGranted = true;
        }
      } catch { /* treasury out of property shares */ }
    }

    // confirm everything before responding so balances are queryable immediately.
    await Promise.all(hashes.map((h) => pub.waitForTransactionReceipt({ hash: h })));

    return NextResponse.json({
      ok: true,
      address: to,
      funded: {
        nativeGasUsdc: Number(formatEther(GAS_TOPUP)),
        usdc: 50000,
        rwaBasket: Object.keys(RWA_GRANT),
        propertyShares: propGranted ? 10 : 0,
      },
      txs,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message.split("\n")[0], txs },
      { status: 502 }
    );
  }
}
