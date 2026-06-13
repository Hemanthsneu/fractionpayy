import { createPublicClient, http, formatUnits, type Address } from "viem";
import { arcTestnet } from "./chains";
import { deployments } from "./deployments";
import { erc20Abi, aggregatorAbi } from "./contracts";
import type { Position } from "./optimizer";

const arcClient = createPublicClient({ chain: arcTestnet, transport: http() });

/** Read a wallet's full RWA portfolio (balances + live oracle prices) from Arc. */
export async function getPortfolio(owner: Address): Promise<Position[]> {
  const { rwas } = deployments.arcTestnet;

  const results = await Promise.all(
    rwas.map(async (rwa) => {
      const [balance, round] = await Promise.all([
        arcClient.readContract({
          address: rwa.token,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [owner],
        }),
        arcClient.readContract({
          address: rwa.feed,
          abi: aggregatorAbi,
          functionName: "latestRoundData",
        }),
      ]);

      const priceUsd = Number(formatUnits(round[1], 8)); // Chainlink 8-dec USD
      const bal = Number(formatUnits(balance, 18));
      return {
        symbol: rwa.symbol,
        token: rwa.token,
        balance: bal,
        priceUsd,
        valueUsd: bal * priceUsd,
        yieldBps: rwa.yieldBps,
      } satisfies Position;
    })
  );

  return results;
}
