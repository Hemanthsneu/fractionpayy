"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { parseUnits } from "viem";
import { Building2, Coins, Loader2, CheckCircle2, TrendingUp, ExternalLink } from "lucide-react";
import { deployments } from "@/lib/deployments";
import { propertyTokenAbi, erc20Abi } from "@/lib/contracts";
import { useArc } from "@/lib/useArc";
import { txUrl, shortHash } from "@/lib/explorer";
import { FundWallet } from "./FundWallet";

interface PropertyState {
  name: string;
  location: string;
  valuationUsd: number;
  annualYieldPct: number;
  totalShares: number;
  yourShares: number;
  yourOwnershipPct: number;
  totalDividendsDistributed: number;
  distributionCount: number;
  claimableUsd: number;
}

const dep = deployments.arcTestnet;
const PROP = dep.property;

export function PropertyDividends({ initial }: { initial: PropertyState }) {
  const { address } = useAccount();
  const { write } = useArc();
  const [state, setState] = useState<PropertyState>(initial);
  const [busy, setBusy] = useState<"" | "distribute" | "claim">("");
  const [statusStep, setStatusStep] = useState("");
  const [flash, setFlash] = useState<{ msg: string; tx: string } | null>(null);
  const [error, setError] = useState<string>("");

  const refresh = useCallback(async () => {
    if (!address) return;
    const s = await fetch(`/api/property?address=${address}`, { cache: "no-store" }).then((r) => r.json()).catch(() => null);
    if (s && !s.error) setState(s);
  }, [address]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function relay(action: "distribute" | "claim"): Promise<string> {
    const res = await fetch("/api/property", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error ?? "relayer failed");
    return data.tx as string;
  }

  async function distribute() {
    setBusy("distribute");
    setError("");
    setFlash(null);
    try {
      const amt = parseUnits("1500", 6); // a quarter of rent on the issued float
      let tx: string;
      let viaRelayer = false;
      try {
        setStatusStep("Approve USDC for the distribution…");
        await write({ address: dep.usdc, abi: erc20Abi, functionName: "approve", args: [PROP, amt] });
        setStatusStep("Distribute rent to all shareholders…");
        tx = await write({ address: PROP, abi: propertyTokenAbi, functionName: "distributeDividends", args: [amt] });
      } catch {
        // Distribution credits ALL holders pro-rata (incl. you), so relaying is
        // still correct — it just funds the dividend pool from the treasury.
        setStatusStep("Distributing via relayer…");
        tx = await relay("distribute");
        viaRelayer = true;
      }
      setFlash({ msg: `Quarterly rent distributed to all shareholders in USDC ✓${viaRelayer ? " (via relayer)" : ""}`, tx });
      await refresh();
    } catch (e) {
      setError((e as Error).message.split("\n")[0]);
    } finally {
      setBusy("");
      setStatusStep("");
    }
  }

  async function claim() {
    setBusy("claim");
    setError("");
    setFlash(null);
    try {
      // Only the shareholder can claim their own dividends — there is no
      // claim-on-behalf, so this MUST be signed by your wallet (no relayer).
      setStatusStep("Confirm claim in your wallet…");
      const tx = await write({ address: PROP, abi: propertyTokenAbi, functionName: "claimDividend", args: [] });
      setFlash({ msg: `Claimed $${state.claimableUsd.toFixed(2)} → your wallet ✓`, tx });
      await refresh();
    } catch (e) {
      setError(`Couldn't sign from this wallet (${(e as Error).message.split("\n")[0]}). Claims must be signed by the shareholder — try connecting MetaMask.`);
    } finally {
      setBusy("");
      setStatusStep("");
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-[var(--fg)]/10 bg-[var(--fg)]/5 p-6 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🏢</span>
          <div>
            <h1 className="text-2xl font-bold">{state.name}</h1>
            <p className="text-sm text-[var(--fg)]/50">{state.location}</p>
          </div>
          <span className="ml-auto flex items-center gap-1 rounded-full bg-[var(--citrus)]/10 px-3 py-1 text-sm text-[var(--citrus)]">
            <TrendingUp size={14} /> {state.annualYieldPct}% rent yield
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Valuation" value={`$${(state.valuationUsd / 1e6).toFixed(0)}M`} />
          <Stat label="Your shares" value={`${state.yourShares.toLocaleString()}`} sub={`${state.yourOwnershipPct.toFixed(1)}% owned`} />
          <Stat label="Rent paid (lifetime)" value={`$${state.totalDividendsDistributed.toLocaleString()}`} sub={`${state.distributionCount} distributions`} />
          <Stat label="Claimable now" value={`$${state.claimableUsd.toFixed(2)}`} highlight />
        </div>

        {address && state.yourShares < 0.0001 && (
          <div className="mt-4 rounded-xl border border-[var(--citrus)]/30 bg-[var(--citrus)]/5 p-3 text-sm text-[var(--fg)]/70">
            You don&apos;t hold shares of this property yet. Fund your wallet to receive starter shares, then claim dividends.
            <div className="mt-2"><FundWallet compact onFunded={() => setTimeout(refresh, 1500)} /></div>
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button onClick={distribute} disabled={busy !== ""} className="flex items-center justify-center gap-2 rounded-xl border border-[var(--fg)]/15 py-3 text-sm font-medium transition hover:bg-[var(--fg)]/5 disabled:opacity-40">
            {busy === "distribute" ? <Loader2 size={16} className="animate-spin" /> : <Building2 size={16} />}
            Distribute quarterly rent (issuer)
          </button>
          <button onClick={claim} disabled={busy !== "" || state.claimableUsd < 0.01} className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--citrus)] to-[var(--sage)] py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-40">
            {busy === "claim" ? <Loader2 size={16} className="animate-spin" /> : <Coins size={16} />}
            Claim ${state.claimableUsd.toFixed(2)} dividends
          </button>
        </div>

        {statusStep && <p className="mt-3 text-center text-xs text-[var(--sage)]">{statusStep}</p>}
        {flash && (
          <p className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-[var(--citrus)]">
            <CheckCircle2 size={15} /> {flash.msg}
            <a href={txUrl("arc", flash.tx)} target="_blank" rel="noreferrer" className="flex items-center gap-1 underline">{shortHash(flash.tx)} <ExternalLink size={11} /></a>
          </p>
        )}
        {error && <p className="mt-4 text-center text-sm text-red-400">{error}</p>}
      </motion.div>

      <p className="mt-4 text-center text-xs text-[var(--fg)]/40">
        Tokenized on Arc · dividends paid in USDC · pro-rata to every shareholder · the same shares are spendable via the FractionPay vault.
      </p>
    </div>
  );
}

function Stat({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? "bg-[var(--citrus)]/10" : "bg-[var(--fg)]/5"}`}>
      <p className="text-xs text-[var(--fg)]/50">{label}</p>
      <p className={`mt-1 text-lg font-bold ${highlight ? "text-[var(--citrus)]" : ""}`}>{value}</p>
      {sub && <p className="text-[11px] text-[var(--fg)]/40">{sub}</p>}
    </div>
  );
}
