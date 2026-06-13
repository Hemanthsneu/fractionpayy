/**
 * LI.FI integration — cross-chain settlement routing.
 *
 * FractionPay settles on Arc, but a merchant may want USDC on a different
 * chain. LI.FI provides the cross-chain route (bridge + swap) so the merchant
 * receives funds where they want them. This is LI.FI's native purpose
 * (cross-chain execution), distinct from the Uniswap same-chain swap quote.
 */
const LIFI_API = "https://li.quest/v1/quote";

const USDC = {
  base: { chainId: 8453, token: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" },
  optimism: { chainId: 10, token: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85" },
  arbitrum: { chainId: 42161, token: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" },
  polygon: { chainId: 137, token: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" },
} as const;

export interface LifiRoute {
  source: "lifi";
  tool: string; // e.g. "across"
  fromChain: string;
  toChain: string;
  estimatedSeconds: number;
  toAmountUsd: number;
}

/** Real cross-chain USDC route quote via LI.FI (settle Base -> merchant chain). */
export async function getSettlementRoute(
  toChainKey: keyof typeof USDC,
  usdAmount: number
): Promise<LifiRoute | null> {
  const key = process.env.LIFI_API_KEY;
  if (!key || toChainKey === "base") return null;

  const from = USDC.base;
  const to = USDC[toChainKey];
  const amount = Math.max(Math.round(usdAmount * 1e6), 1_000_000).toString();

  try {
    const url = `${LIFI_API}?fromChain=${from.chainId}&toChain=${to.chainId}&fromToken=${from.token}&toToken=${to.token}&fromAmount=${amount}&fromAddress=0x45763cE2De66E3261278228aA998AAC917FA14E1`;
    const res = await fetch(url, { headers: { "x-lifi-api-key": key } });
    if (!res.ok) return null;
    const q = await res.json();
    return {
      source: "lifi",
      tool: q?.tool ?? "lifi",
      fromChain: "Base",
      toChain: toChainKey,
      estimatedSeconds: Number(q?.estimate?.executionDuration ?? 0),
      toAmountUsd: Number(q?.estimate?.toAmountUSD ?? usdAmount),
    };
  } catch {
    return null;
  }
}
