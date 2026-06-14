"use client";

/**
 * Wallet-side signing on Arc, driven by the visitor's OWN connected wallet
 * (via Dynamic → wagmi). Every write here pops the wallet for a real signature;
 * nothing is signed by a server shadow wallet.
 *
 * Arc is a custom chain, so we make sure the wallet is added + switched to it
 * before signing (MetaMask shows the add-network / switch prompt once).
 */
import { useCallback } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { type Abi, type Address } from "viem";
import { arcTestnet } from "./chains";

export interface ArcWrite {
  address: Address;
  abi: Abi;
  functionName: string;
  args: readonly unknown[];
}

export interface ArcDeploy {
  abi: Abi;
  bytecode: `0x${string}`;
  args: readonly unknown[];
}

export function useArc() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient({ chainId: arcTestnet.id });

  /** Make sure the connected wallet is on Arc (add it if MetaMask doesn't know it). */
  const ensureArc = useCallback(async () => {
    if (!walletClient) throw new Error("Connect a wallet first");
    try {
      await walletClient.switchChain({ id: arcTestnet.id });
    } catch (e) {
      const msg = (e as Error).message ?? "";
      const code = (e as { code?: number }).code;
      if (code === 4902 || /Unrecognized chain|not been added|addEthereumChain/i.test(msg)) {
        await walletClient.addChain({ chain: arcTestnet });
        await walletClient.switchChain({ id: arcTestnet.id });
      } else {
        throw e;
      }
    }
  }, [walletClient]);

  /**
   * Confirm a tx by polling eth_getTransactionReceipt directly. Arc's RPC 400s
   * on viem's default block-watcher receipt flow even though the tx mines fine,
   * so we poll the plain method (which works) and tolerate transient errors.
   */
  const confirm = useCallback(
    async (hash: `0x${string}`) => {
      if (!publicClient) return null;
      for (let i = 0; i < 45; i++) {
        try {
          const r = await publicClient.getTransactionReceipt({ hash });
          if (r) return r;
        } catch {
          /* not mined yet / transient RPC */
        }
        await new Promise((res) => setTimeout(res, 1500));
      }
      return null; // timed out waiting, but the tx was broadcast
    },
    [publicClient]
  );

  /** Sign a contract write on Arc and confirm it. Throws ONLY if broadcast fails. */
  const write = useCallback(
    async (call: ArcWrite): Promise<`0x${string}`> => {
      if (!walletClient || !publicClient) throw new Error("Connect a wallet first");
      await ensureArc();
      // Broadcast (the wallet builds/signs/sends — 1559 works on Arc). A throw
      // here means the tx never went out, so the caller may safely relay.
      let hash: `0x${string}`;
      try {
        hash = await walletClient.writeContract({
          ...call,
          account: walletClient.account,
          chain: arcTestnet,
        });
      } catch (e) {
        const err = e as { shortMessage?: string; details?: string; message?: string };
        throw new Error(err.shortMessage || err.details || err.message || "wallet broadcast failed");
      }
      // Confirm the tx actually succeeded — a reverted tx must NOT look successful.
      const rcpt = await confirm(hash);
      if (rcpt && rcpt.status === "reverted") {
        throw new Error("Transaction reverted on-chain (likely insufficient balance)");
      }
      return hash;
    },
    [walletClient, publicClient, ensureArc, confirm]
  );

  /** Deploy a contract on Arc from the connected wallet; returns its address + tx. */
  const deploy = useCallback(
    async (d: ArcDeploy): Promise<{ address: Address; hash: `0x${string}` }> => {
      if (!walletClient || !publicClient) throw new Error("Connect a wallet first");
      await ensureArc();
      const hash = await walletClient.deployContract({
        abi: d.abi,
        bytecode: d.bytecode,
        args: d.args,
        account: walletClient.account,
        chain: arcTestnet,
      });
      const rcpt = await confirm(hash);
      if (!rcpt?.contractAddress) throw new Error("deploy: no contract address in receipt");
      return { address: rcpt.contractAddress, hash };
    },
    [walletClient, publicClient, ensureArc, confirm]
  );

  return { address, isConnected, walletClient, publicClient, ensureArc, write, deploy };
}
