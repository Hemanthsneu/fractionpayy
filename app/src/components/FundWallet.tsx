"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Loader2, Coins, CheckCircle2, Droplets } from "lucide-react";

/**
 * One-tap demo faucet. Arc uses USDC for gas, so a fresh wallet can't sign
 * anything yet — this server-funds the CONNECTED address with native gas +
 * test USDC + a starter RWA basket, after which every action is wallet-signed.
 */
export function FundWallet({ onFunded, compact }: { onFunded?: () => void; compact?: boolean }) {
  const { address, isConnected } = useAccount();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function fund() {
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
      onFunded?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!isConnected) return null;

  if (done && compact) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-[var(--sage)]">
        <CheckCircle2 size={14} /> Wallet funded on Arc
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
