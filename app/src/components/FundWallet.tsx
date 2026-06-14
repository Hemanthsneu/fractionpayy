"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { Loader2, Coins, CheckCircle2, Droplets } from "lucide-react";
import { arcTestnet } from "@/lib/chains";

const FUNDED_KEY = (addr: string) => `fp:funded:${addr.toLowerCase()}`;

/**
 * One-tap demo faucet. Arc uses USDC as its gas token, so a fresh wallet can't sign
 * anything yet — this server-funds the CONNECTED address with native gas +
 * test USDC + a starter RWA basket, after which every action is wallet-signed.
 *
 * Persists the funded state in sessionStorage (keyed by address) so navigation
 * away and back doesn't re-show the button. Also auto-detects wallets that
 * already have native Arc gas (>0.5 USDC) and skips the prompt.
 */
export function FundWallet({ onFunded, compact }: { onFunded?: () => void; compact?: boolean }) {
  const { address, isConnected } = useAccount();
  const { data: nativeBal } = useBalance({ address, chainId: arcTestnet.id });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // Restore persisted funded state or auto-detect funded wallets.
  useEffect(() => {
    if (!address) return;
    // 1. Check sessionStorage first
    if (sessionStorage.getItem(FUNDED_KEY(address))) {
      setDone(true);
      return;
    }
    // 2. Auto-detect: if the wallet already has >0.5 native USDC, it's funded.
    if (nativeBal && nativeBal.value > BigInt("500000000000000000")) {
      setDone(true);
      sessionStorage.setItem(FUNDED_KEY(address), "1");
    }
  }, [address, nativeBal]);

  const fund = useCallback(async () => {
    if (!address) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "faucet failed");
      setDone(true);
      sessionStorage.setItem(FUNDED_KEY(address), "1");
      onFunded?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [address, onFunded]);

  if (!isConnected) return null;

  if (done && compact) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-[var(--sage)]">
        <CheckCircle2 size={14} /> Wallet funded on Arc
        <button
          onClick={() => { setDone(false); if (address) sessionStorage.removeItem(FUNDED_KEY(address)); }}
          className="ml-1 underline opacity-60 hover:opacity-100 transition"
        >
          Top up again
        </button>
      </span>
    );
  }

  return (
    <div className={compact ? "" : "rounded-2xl border border-[var(--citrus)]/30 bg-[var(--citrus)]/10 p-5"}>
      {!compact && (
        <div className="mb-3 flex items-center gap-2 text-[var(--citrus)]">
          <Droplets size={18} />
          <span className="font-semibold">Fund your wallet on Arc</span>
        </div>
      )}
      {!compact && (
        <p className="mb-4 text-sm text-[var(--fg)]/60">
          Arc uses USDC as its gas token. Tap below to receive native gas, 50,000 test USDC, and a
          starter basket of tokenized assets — then you sign every transaction yourself.
        </p>
      )}
      <button
        onClick={fund}
        disabled={busy || done}
        className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--citrus)] to-[var(--sage)] px-5 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : done ? <CheckCircle2 size={16} /> : <Coins size={16} />}
        {busy ? "Funding on Arc…" : done ? "Funded ✓" : "Fund my wallet (test USDC + RWAs)"}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
