/**
 * Admin tokenization — deploys a NEW tokenized RWA on Arc from the dashboard:
 *   1. deploy MockRWA (the share token) + YieldAggregator (its price feed)
 *   2. register it in the FractionPayVault (spendable)
 *   3. list it on the RWAMarket (investable)
 * Server-side with the admin (deployer) key. This is the issuer onboarding flow.
 */
import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arcTestnet } from "@/lib/chains";
import { deployments } from "@/lib/deployments";
import { vaultAbi, marketAbi } from "@/lib/contracts";
import { MOCK_RWA_BYTECODE, YIELD_AGG_BYTECODE } from "@/lib/artifacts";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const pub = createPublicClient({ chain: arcTestnet, transport: http() });
const rwaCtorAbi = parseAbi(["constructor(string name, string symbol, uint16 yieldBps)"]);
const aggCtorAbi = parseAbi(["constructor(int256 basePrice, uint16 apyBps, string desc)"]);

export async function POST(request: NextRequest) {
  const { name, symbol, assetType, priceUsd, yieldPct } = await request.json().catch(() => ({}));
  if (!name || !symbol) return NextResponse.json({ error: "name + symbol required" }, { status: 400 });

  const pk = process.env.BUYER_PRIVATE_KEY; // the deployer/owner of vault + market
  if (!pk) return NextResponse.json({ error: "admin key not configured" }, { status: 500 });

  const dep = deployments.arcTestnet;
  const account = privateKeyToAccount(pk as `0x${string}`);
  const wallet = createWalletClient({ account, chain: arcTestnet, transport: http() });

  const apyBps = Math.round(Number(yieldPct ?? 5) * 100);
  const basePrice = BigInt(Math.round(Number(priceUsd ?? 100) * 1e8)); // 8-dec USD

  try {
    // 1a. deploy share token
    const tokenHash = await wallet.deployContract({
      abi: rwaCtorAbi,
      bytecode: MOCK_RWA_BYTECODE as `0x${string}`,
      args: [name, symbol, apyBps],
    });
    const tokenRcpt = await pub.waitForTransactionReceipt({ hash: tokenHash });
    const token = tokenRcpt.contractAddress!;

    // 1b. deploy price feed
    const feedHash = await wallet.deployContract({
      abi: aggCtorAbi,
      bytecode: YIELD_AGG_BYTECODE as `0x${string}`,
      args: [basePrice, apyBps, `${symbol}/USD`],
    });
    const feedRcpt = await pub.waitForTransactionReceipt({ hash: feedHash });
    const feed = feedRcpt.contractAddress!;

    // 2. register in the vault (spendable)
    const regHash = await wallet.writeContract({
      address: dep.vault,
      abi: vaultAbi,
      functionName: "registerRWA",
      args: [token, feed, apyBps],
    });
    await pub.waitForTransactionReceipt({ hash: regHash });

    // 3. list on the market (investable)
    const listHash = await wallet.writeContract({
      address: dep.market,
      abi: marketAbi,
      functionName: "list",
      args: [token, feed, apyBps, assetType ?? "other", name],
    });
    await pub.waitForTransactionReceipt({ hash: listHash });

    return NextResponse.json({
      ok: true,
      token,
      feed,
      name,
      symbol,
      assetType: assetType ?? "other",
      priceUsd: Number(priceUsd ?? 100),
      yieldPct: Number(yieldPct ?? 5),
      txs: { token: tokenHash, feed: feedHash, register: regHash, list: listHash },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message.split("\n")[0] }, { status: 502 });
  }
}
