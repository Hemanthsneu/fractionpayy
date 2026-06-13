"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Coins, Loader2, CheckCircle2, TrendingUp } from "lucide-react";

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

export function PropertyDividends({ initial }: { initial: PropertyState }) {
  const [state, setState] = useState<PropertyState>(initial);
  const [busy, setBusy] = useState<"" | "distribute" | "claim">("");
  const [flash, setFlash] = useState<string>("");
  const [error, setError] = useState<string>("");

  async function act(action: "distribute" | "claim") {
    setBusy(action);
    setError("");
    setFlash("");
    try {
      const res = await fetch("/api/property", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "failed");
      setState(data.state);
      setFlash(
        action === "distribute"
          ? "Quarterly rent distributed to all shareholders in USDC ✓"
          : `Claimed $${Number(data.state.claimableUsd).toFixed(2)} → your wallet ✓`
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
      >
        <div className="flex items-center gap-3">
          <span className="text-4xl">🏢</span>
          <div>
            <h1 className="text-2xl font-bold">{state.name}</h1>
            <p className="text-sm text-white/50">{state.location}</p>
          </div>
          <span className="ml-auto flex items-center gap-1 rounded-full bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">
            <TrendingUp size={14} /> {state.annualYieldPct}% rent yield
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Valuation" value={`$${(state.valuationUsd / 1e6).toFixed(0)}M`} />
          <Stat label="Your shares" value={`${state.yourShares.toLocaleString()}`} sub={`${state.yourOwnershipPct.toFixed(1)}% owned`} />
          <Stat label="Rent paid (lifetime)" value={`$${state.totalDividendsDistributed.toLocaleString()}`} sub={`${state.distributionCount} distributions`} />
          <Stat label="Claimable now" value={`$${state.claimableUsd.toFixed(2)}`} highlight />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => act("distribute")}
            disabled={busy !== ""}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/15 py-3 text-sm font-medium transition hover:bg-white/5 disabled:opacity-40"
          >
            {busy === "distribute" ? <Loader2 size={16} className="animate-spin" /> : <Building2 size={16} />}
            Distribute quarterly rent (issuer)
          </button>
          <button
            onClick={() => act("claim")}
            disabled={busy !== "" || state.claimableUsd < 0.01}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-40"
          >
            {busy === "claim" ? <Loader2 size={16} className="animate-spin" /> : <Coins size={16} />}
            Claim ${state.claimableUsd.toFixed(2)} dividends
          </button>
        </div>

        {flash && (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-emerald-300">
            <CheckCircle2 size={15} /> {flash}
          </p>
        )}
        {error && <p className="mt-4 text-center text-sm text-red-400">{error}</p>}
      </motion.div>

      <p className="mt-4 text-center text-xs text-white/40">
        Tokenized on Arc · dividends paid in USDC · pro-rata to every shareholder ·
        the same shares are spendable via the FractionPay vault.
      </p>
    </div>
  );
}

function Stat({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? "bg-emerald-400/10" : "bg-white/5"}`}>
      <p className="text-xs text-white/50">{label}</p>
      <p className={`mt-1 text-lg font-bold ${highlight ? "text-emerald-300" : ""}`}>{value}</p>
      {sub && <p className="text-[11px] text-white/40">{sub}</p>}
    </div>
  );
}
