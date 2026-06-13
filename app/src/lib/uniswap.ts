/**
 * Uniswap API integration — live market execution reference.
 *
 * FractionPay sources the best on-chain price/route for the conversion leg
 * via the Uniswap Trading API (requires a developer key). For real RWA tokens
 * (Ondo, Backed, …) that trade on Uniswap this is the actual execution route;
 * for the demo's testnet mocks we surface the live reference quote for the
 * equivalent USD notional so the user sees real Uniswap routing + price impact.
 */
const UNISWAP_API = "https://trade-api.gateway.uniswap.org/v1/quote";

// Base mainnet canonical addresses for the reference quote.
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const WETH_BASE = "0x4200000000000000000000000000000000000006";

export interface UniswapRef {
  source: "uniswap-api";
  routeString: string;
  priceImpact: number;
  gasFeeUsd: number;
  poolType: string;
  inputUsd: number;
}

/** Live USDC-notional quote via Uniswap API (read-only, key-gated). */
export async function getExecutionReference(usdAmount: number): Promise<UniswapRef | null> {
  const key = process.env.UNISWAP_API_KEY;
  if (!key) return null;

  const amount = Math.max(Math.round(usdAmount * 1e6), 1_000_000).toString(); // 6-dec USDC
  try {
    const res = await fetch(UNISWAP_API, {
      method: "POST",
      headers: { "x-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        tokenIn: USDC_BASE,
        tokenOut: WETH_BASE,
        tokenInChainId: 8453,
        tokenOutChainId: 8453,
        amount,
        type: "EXACT_INPUT",
        swapper: "0x45763cE2De66E3261278228aA998AAC917FA14E1",
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const q = data.quote;
    return {
      source: "uniswap-api",
      routeString: q?.routeString ?? "Uniswap route",
      priceImpact: Number(q?.priceImpact ?? 0),
      gasFeeUsd: Number(q?.gasFeeUSD ?? 0),
      poolType: data?.routing ?? "CLASSIC",
      inputUsd: usdAmount,
    };
  } catch {
    return null;
  }
}
