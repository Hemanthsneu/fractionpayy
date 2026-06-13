"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDynamicContext, useOpenFundingOptions } from "@dynamic-labs/sdk-react-core";
import { Loader2, Bot, CheckCircle2, Receipt, ArrowRight, Zap, Wallet } from "lucide-react";
import { deployments, demoWallets } from "@/lib/deployments";
import type { Merchant } from "@/lib/merchants";
import type { LiquidationPlan, Position } from "@/lib/optimizer";
import { WorldVerify } from "./WorldGate";

type Step = "amount" | "hiring" | "plan" | "paying" | "done";

interface HireResult {
  agent: string;
  erc8004AgentId: string | null;
  plan: LiquidationPlan;
  x402: { feeUsd: number; settlementTx: string | null; network: string };
}

export function PaymentFlow({ merchant }: { merchant: Merchant }) {
  const { primaryWallet } = useDynamicContext();
  const { openFundingOptions } = useOpenFundingOptions();
  const isConnected = !!primaryWallet;

  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("6.00");
  const [hire, setHire] = useState<HireResult | null>(null);
  const [uniRef, setUniRef] = useState<{ routeString: string; priceImpact: number } | null>(null);
  const [lifiRoute, setLifiRoute] = useState<{ tool: string; estimatedSeconds: number } | null>(null);
  const [payTx, setPayTx] = useState<string>("");
  const [error, setError] = useState<string>("");

  const dep = deployments.arcTestnet;

  async function hireAgent() {
    setError("");
    setStep("hiring");
    try {
      // Portfolio is the funded demo wallet — independent of which wallet the
      // visitor connects (so funds always load, on any device).
      const pf = await fetch(`/api/portfolio?address=${demoWallets.buyer}`).then((r) => r.json());
      const positions: Position[] = pf.positions;
      const res = await fetch("/api/hire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountUsd: Number(amount), positions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "agent call failed");
      setHire(data);
      setStep("plan");
      // Non-blocking: live Uniswap execution reference for the swap leg.
      fetch(`/api/uniswap-quote?usd=${Number(amount)}`)
        .then((r) => r.json())
        .then((u) => u.available && setUniRef({ routeString: u.routeString, priceImpact: u.priceImpact }))
        .catch(() => {});
    } catch (e) {
      setError((e as Error).message);
      setStep("amount");
    }
  }

  async function confirmPayment() {
    if (!hire) return;
    setError("");
    setStep("paying");
    try {
      // FractionPay settles on Arc server-side (works on any device — no chain
      // switch / no RWA needed in the visitor's wallet).
      const res = await fetch("/api/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: hire.plan.symbol,
          sellAmount: hire.plan.sellAmount,
          merchant: merchant.address,
          amountUsd: Number(amount),
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "settlement failed");
      const tx = data.settlementTx as string;
      setPayTx(tx);
      setStep("done");
      // Show that cross-chain settlement to other chains is available via LI.FI.
      fetch(`/api/lifi-route?usd=${Number(amount)}&chain=optimism`)
        .then((r) => r.json())
        .then((l) => l.available && setLifiRoute({ tool: l.tool, estimatedSeconds: l.estimatedSeconds }))
        .catch(() => {});

      // Close the ERC-8004 reputation loop (fire-and-forget).
      fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: 100, paymentTx: tx }),
      }).catch(() => {});
    } catch (e) {
      setError((e as Error).message.split("\n")[0]);
      setStep("plan");
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <AnimatePresence mode="wait">
        {step === "amount" && (
          <motion.div
            key="amount"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
          >
            <label className="text-sm text-white/60">Amount (USD)</label>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-3xl font-bold text-white/40">$</span>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                className="w-full bg-transparent text-4xl font-bold outline-none"
              />
            </div>
            <button
              onClick={hireAgent}
              disabled={!Number(amount)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 py-3 font-semibold text-black transition hover:opacity-90 disabled:opacity-40"
            >
              <Bot size={18} /> Hire optimizer agent <ArrowRight size={16} />
            </button>
            {isConnected ? (
              <button
                onClick={() => openFundingOptions()}
                className="mt-3 flex w-full items-center justify-center gap-1.5 text-xs text-white/50 transition hover:text-white/80"
              >
                <Wallet size={13} /> Fund from any wallet, chain, or exchange (Dynamic Flow)
              </button>
            ) : (
              <p className="mt-3 text-center text-xs text-white/50">
                Connect a wallet (top right) to pay — plan preview works without one.
              </p>
            )}
            <WorldVerify />
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          </motion.div>
        )}

        {step === "hiring" && (
          <motion.div
            key="hiring"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur"
          >
            <Loader2 className="mx-auto animate-spin text-emerald-300" size={32} />
            <p className="mt-4 font-medium">Hiring optimizer.fractionpay.eth…</p>
            <p className="mt-2 text-sm text-white/50">
              Paying $0.001 USDC via x402 · ERC-8004 agent #7031
            </p>
          </motion.div>
        )}

        {step === "plan" && hire && (
          <motion.div
            key="plan"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="rounded-2xl border border-emerald-300/20 bg-emerald-400/5 p-6 backdrop-blur"
          >
            <div className="flex items-center gap-2 text-emerald-300">
              <Bot size={18} />
              <span className="text-sm font-semibold">Agent recommendation</span>
              {hire.x402.settlementTx && (
                <span className="ml-auto flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                  <Zap size={10} /> paid via x402
                </span>
              )}
            </div>
            <p className="mt-3 text-2xl font-bold">
              Sell {hire.plan.sellPercentOfPosition.toFixed(4)}% of {hire.plan.symbol}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/70">{hire.plan.reason}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-white/50">
              <div className="rounded-lg bg-white/5 p-2">
                Sell amount
                <div className="mt-0.5 font-mono text-white/90">
                  {hire.plan.sellAmount.toFixed(6)} {hire.plan.symbol}
                </div>
              </div>
              <div className="rounded-lg bg-white/5 p-2">
                Yield lost / yr
                <div className="mt-0.5 font-mono text-white/90">
                  ${hire.plan.annualYieldLostUsd.toFixed(2)}
                </div>
              </div>
            </div>
            {uniRef && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-pink-400/5 px-3 py-2 text-xs text-pink-200">
                <span className="font-semibold">Uniswap</span>
                <span className="text-white/50">
                  best route · {uniRef.priceImpact.toFixed(2)}% impact
                </span>
              </div>
            )}
            <button
              onClick={confirmPayment}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 py-3 font-semibold text-black transition hover:opacity-90"
            >
              Pay {merchant.displayName} ${amount}
            </button>
            {!isConnected && (
              <p className="mt-2 text-center text-[11px] text-white/40">
                {"Tip: connect a wallet + verify World ID above to show those steps — payment settles either way."}
              </p>
            )}
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          </motion.div>
        )}

        {step === "paying" && (
          <motion.div
            key="paying"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur"
          >
            <Loader2 className="mx-auto animate-spin text-cyan-300" size={32} />
            <p className="mt-4 font-medium">Settling on Arc…</p>
            <p className="mt-2 text-sm text-white/50">
              approve {hire?.plan.symbol} → oracle price check → USDC to merchant
            </p>
          </motion.div>
        )}

        {step === "done" && hire && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 p-6 backdrop-blur"
          >
            <div className="flex items-center gap-2 text-emerald-300">
              <CheckCircle2 size={22} />
              <span className="text-lg font-bold">Payment settled</span>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <ReceiptRow label="Merchant" value={merchant.displayName} />
              <ReceiptRow label="Paid" value={`$${amount} USDC (Arc)`} />
              <ReceiptRow
                label="Liquidated"
                value={`${hire.plan.sellAmount.toFixed(6)} ${hire.plan.symbol}`}
              />
              <ReceiptRow label="Agent fee" value="$0.001 via x402 (Base Sepolia)" />
              <ReceiptRow label="Reputation" value="feedback posted → ERC-8004 #7031" />
              {lifiRoute && (
                <ReceiptRow
                  label="Cross-chain"
                  value={`Optimism in ~${lifiRoute.estimatedSeconds}s via ${lifiRoute.tool} (LI.FI)`}
                />
              )}
            </div>
            <div className="mt-4 flex flex-col gap-1 text-xs text-white/40">
              <span className="truncate font-mono">settlement: {payTx}</span>
              {hire.x402.settlementTx && (
                <span className="truncate font-mono">x402: {hire.x402.settlementTx}</span>
              )}
            </div>
            <button
              onClick={() => {
                setStep("amount");
                setHire(null);
              }}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 py-2.5 text-sm transition hover:bg-white/5"
            >
              <Receipt size={14} /> New payment
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-white/50">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
