"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { parseUnits, formatUnits } from "viem";
import { Loader2, Bot, CheckCircle2, Receipt, ArrowRight, Zap, Wallet, Check } from "lucide-react";
import { deployments, demoWallets } from "@/lib/deployments";
import { vaultAbi, erc20Abi } from "@/lib/contracts";
import { useArc } from "@/lib/useArc";
import { txUrl, shortHash } from "@/lib/explorer";
import type { Merchant } from "@/lib/merchants";
import type { LiquidationPlan, Position } from "@/lib/optimizer";
import { WorldVerify } from "./WorldGate";

type Step = "amount" | "hiring" | "plan" | "approving" | "settling" | "done";

interface HireResult {
  agent: string;
  erc8004AgentId: string | null;
  plan: LiquidationPlan;
  x402: { feeUsd: number; settlementTx: string | null; network: string };
}

const dep = deployments.arcTestnet;

export function PaymentFlow({ merchant }: { merchant: Merchant }) {
  const { address: arcAddress, isConnected, write, publicClient } = useArc();
  const wagmiAccount = useAccount();
  const { primaryWallet } = useDynamicContext();
  // Prefer Dynamic's wallet address — wagmi's useAccount can briefly be undefined
  // and we must NEVER plan/settle against the wrong (treasury) portfolio.
  const address = (primaryWallet?.address ?? arcAddress) as `0x${string}` | undefined;

  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("6.00");
  const [hire, setHire] = useState<HireResult | null>(null);
  const [quote, setQuote] = useState<{ payOut: number; feeUsd: number } | null>(null);
  const [payToken, setPayToken] = useState<"USDC" | "EURC">("USDC");
  const [payTx, setPayTx] = useState<string>("");
  const [relayed, setRelayed] = useState(false);
  const [error, setError] = useState<string>("");
  const [repInfo, setRepInfo] = useState<{ score: number; rank: number; tx: boolean } | null>(null);

  const acceptsEurc = merchant.acceptedTokens.includes("EURC");
  const settleToken = payToken === "EURC" && acceptsEurc ? dep.eurc : dep.usdc;

  async function hireAgent() {
    setError("");
    setStep("hiring");
    try {
      // Use YOUR connected wallet's real portfolio (falls back to the demo
      // portfolio for a no-wallet preview).
      const pfAddr = address ?? demoWallets.buyer;
      const pf = await fetch(`/api/portfolio?address=${pfAddr}`).then((r) => r.json());
      const positions: Position[] = pf.positions;
      const res = await fetch("/api/hire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountUsd: Number(amount), positions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "agent call failed");
      setHire(data);

      // Read the live on-chain quote from the Arc vault for this slice.
      try {
        const sellWei = parseUnits(Number(data.plan.sellAmount).toFixed(18), 18);
        const q = (await publicClient!.readContract({
          address: dep.vault,
          abi: vaultAbi,
          functionName: "quote",
          args: [data.plan.token, sellWei, settleToken],
        })) as [bigint, bigint, bigint];
        setQuote({ payOut: Number(formatUnits(q[0], 6)), feeUsd: Number(formatUnits(q[2], 6)) });
      } catch {
        setQuote(null);
      }
      setStep("plan");
    } catch (e) {
      setError((e as Error).message);
      setStep("amount");
    }
  }

  async function confirmPayment() {
    if (!hire) return;
    if (!isConnected) {
      setError("Connect your wallet (top right) to sign the on-chain settlement.");
      return;
    }
    setError("");
    setRelayed(false);
    try {
      const sellWei = parseUnits(Number(hire.plan.sellAmount).toFixed(18), 18);
      const minOut = parseUnits((Number(amount) * 0.95).toFixed(6), 6);

      // Pre-flight: make sure YOU actually hold enough of the asset to sell.
      if (address) {
        const bal = (await publicClient!.readContract({
          address: hire.plan.token as `0x${string}`,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address],
        })) as bigint;
        if (bal < sellWei) {
          setError(
            `This payment needs ${hire.plan.sellAmount.toFixed(6)} ${hire.plan.symbol}, but your wallet holds ${Number(formatUnits(bal, 18)).toFixed(6)}. Lower the amount or fund your wallet.`
          );
          setStep("plan");
          return;
        }
      }

      let tx: string;
      try {
        // 1) Approve the vault to take the RWA slice — signed by YOUR wallet.
        setStep("approving");
        await write({ address: hire.plan.token as `0x${string}`, abi: erc20Abi, functionName: "approve", args: [dep.vault, sellWei] });

        // 2) Settle: vault swaps your RWA slice → USDC to the merchant on Arc.
        setStep("settling");
        tx = await write({
          address: dep.vault,
          abi: vaultAbi,
          functionName: "pay",
          args: [merchant.address, hire.plan.token as `0x${string}`, sellWei, settleToken, minOut],
        });
      } catch (walletErr) {
        const msg = (walletErr as Error).message.toLowerCase();
        // Only relay on genuine network/broadcast hiccups — NEVER on a revert or
        // insufficient funds (that would hide a real failure as a fake success).
        const isRevert = /revert|insufficient|exceeds|balance|allowance|slippage|user rejected|denied/.test(msg);
        if (isRevert) throw walletErr;
        setStep("settling");
        const res = await fetch("/api/settle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbol: hire.plan.symbol,
            sellAmount: hire.plan.sellAmount,
            merchant: merchant.address,
            amountUsd: Number(amount),
            payToken,
          }),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error ?? (walletErr as Error).message.split("\n")[0]);
        tx = data.settlementTx as string;
        setRelayed(true);
      }
      setPayTx(tx);
      setStep("done");

      // 3) Close the ERC-8004 reputation loop (server posts the on-chain feedback).
      fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: hire.plan, amountUsd: Number(amount), paymentTx: tx }),
      })
        .then((r) => r.json())
        .then((d) => {
          const rank = (d.leaderboard ?? []).findIndex((x: { isOurs: boolean }) => x.isOurs);
          setRepInfo({ score: d.score ?? 100, rank: rank >= 0 ? rank + 1 : 0, tx: !!d.feedbackTx });
        })
        .catch(() => {});
    } catch (e) {
      setError((e as Error).message.split("\n")[0]);
      setStep("plan");
    }
  }

  function reset() {
    setStep("amount");
    setHire(null);
    setQuote(null);
    setRepInfo(null);
    setPayTx("");
    setRelayed(false);
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <AnimatePresence mode="wait">
        {step === "amount" && (
          <motion.div key="amount" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <label className="text-sm text-white/60">Enter any amount (USD)</label>
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 focus-within:border-emerald-300/40">
              <span className="text-3xl font-bold text-white/40">$</span>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0.00" className="w-full bg-transparent py-2 text-4xl font-bold outline-none" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {["3", "6", "25", "100"].map((v) => (
                <button key={v} onClick={() => setAmount(Number(v).toFixed(2))} className={`rounded-lg px-3 py-1 text-sm font-medium transition ${Number(amount) === Number(v) ? "bg-emerald-400 text-black" : "bg-white/5 text-white/60 hover:bg-white/10"}`}>
                  ${v}
                </button>
              ))}
            </div>
            {acceptsEurc && (
              <div className="mt-3 flex gap-2">
                {(["USDC", "EURC"] as const).map((t) => (
                  <button key={t} onClick={() => setPayToken(t)} className={`rounded-lg px-3 py-1 text-xs font-medium transition ${payToken === t ? "bg-emerald-400 text-black" : "bg-white/5 text-white/60"}`}>
                    Pay in {t}
                  </button>
                ))}
              </div>
            )}
            <button onClick={hireAgent} disabled={!Number(amount)} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 py-3 font-semibold text-black transition hover:opacity-90 disabled:opacity-40">
              <Bot size={18} /> Hire optimizer agent <ArrowRight size={16} />
            </button>
            {!isConnected && (
              <p className="mt-3 text-center text-xs text-white/50">Connect a wallet (top right) to settle on-chain — plan preview works without one.</p>
            )}
            <WorldVerify />
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          </motion.div>
        )}

        {step === "hiring" && (
          <motion.div key="hiring" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur">
            <Loader2 className="mx-auto animate-spin text-emerald-300" size={32} />
            <p className="mt-4 font-medium">Hiring optimizer.fractionpay.eth…</p>
            <p className="mt-2 text-sm text-white/50">Paying $0.001 USDC via x402 · ERC-8004 agent #6553</p>
          </motion.div>
        )}

        {(step === "plan" || step === "approving" || step === "settling") && hire && (
          <motion.div key="plan" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="rounded-2xl border border-emerald-300/20 bg-emerald-400/5 p-6 backdrop-blur">
            <div className="flex items-center gap-2 text-emerald-300">
              <Bot size={18} />
              <span className="text-sm font-semibold">Agent recommendation</span>
              {hire.x402.settlementTx && (
                <a href={txUrl("baseSepolia", hire.x402.settlementTx)} target="_blank" rel="noreferrer" className="ml-auto flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] uppercase tracking-wide hover:underline">
                  <Zap size={10} /> paid via x402
                </a>
              )}
            </div>
            <p className="mt-3 text-2xl font-bold">Sell {hire.plan.sellPercentOfPosition.toFixed(4)}% of {hire.plan.symbol}</p>
            <p className="mt-2 text-sm leading-relaxed text-white/70">{hire.plan.reason}</p>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-white/50">
              <div className="rounded-lg bg-white/5 p-2">Sell amount<div className="mt-0.5 font-mono text-white/90">{hire.plan.sellAmount.toFixed(6)} {hire.plan.symbol}</div></div>
              <div className="rounded-lg bg-white/5 p-2">Yield lost / yr<div className="mt-0.5 font-mono text-white/90">${hire.plan.annualYieldLostUsd.toFixed(2)}</div></div>
              {quote && <div className="rounded-lg bg-white/5 p-2">Merchant receives<div className="mt-0.5 font-mono text-emerald-300">{quote.payOut.toFixed(2)} {payToken}</div></div>}
              {quote && <div className="rounded-lg bg-white/5 p-2">Vault fee (to LPs)<div className="mt-0.5 font-mono text-white/90">${quote.feeUsd.toFixed(4)}</div></div>}
            </div>

            {/* explicit on-chain settlement stepper */}
            <div className="mt-4 space-y-1.5 rounded-xl bg-black/20 p-3">
              <StepRow done active={false} label="Agent hired & paid (x402, Base Sepolia)" />
              <StepRow done active={false} label="Optimal slice quoted via Arc vault (Chainlink)" />
              <StepRow done={step === "settling"} active={step === "approving"} label={`Approve ${hire.plan.symbol} in your wallet`} />
              <StepRow done={false} active={step === "settling"} label={`Vault swaps ${hire.plan.symbol} → ${payToken} to merchant on Arc`} />
            </div>

            <button onClick={confirmPayment} disabled={step === "approving" || step === "settling"} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 py-3 font-semibold text-black transition hover:opacity-90 disabled:opacity-60">
              {(step === "approving" || step === "settling") && <Loader2 size={16} className="animate-spin" />}
              {step === "approving" ? "Approve in wallet…" : step === "settling" ? "Settling on Arc…" : `Pay ${merchant.displayName} $${amount}`}
            </button>
            {!isConnected && <p className="mt-2 text-center text-[11px] text-amber-300/80">Connect your wallet to sign the settlement.</p>}
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          </motion.div>
        )}

        {step === "done" && hire && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 p-6 backdrop-blur">
            <div className="flex items-center gap-2 text-emerald-300">
              <CheckCircle2 size={22} /><span className="text-lg font-bold">Payment settled</span>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <ReceiptRow label="Merchant" value={merchant.displayName} />
              <ReceiptRow label="Paid" value={`$${amount} ${payToken} (Arc)`} />
              <ReceiptRow label="Liquidated" value={`${hire.plan.sellAmount.toFixed(6)} ${hire.plan.symbol}`} />
              <ReceiptRow label="Settled by" value={relayed ? "FractionPay relayer" : wagmiAccount.address ? `your wallet ${wagmiAccount.address.slice(0, 6)}…${wagmiAccount.address.slice(-4)}` : "your wallet"} />
              <ReceiptRow label="Agent fee" value="$0.001 via x402 (Base Sepolia)" />
              <ReceiptRow label="Reputation" value={repInfo ? `scored ${repInfo.score}/100${repInfo.tx ? " (on Ethereum)" : ""} → #${repInfo.rank} on leaderboard` : "scoring agent → posting feedback…"} />
            </div>
            <div className="mt-4 flex flex-col gap-1 text-xs text-white/40">
              <a href={txUrl("arc", payTx)} target="_blank" rel="noreferrer" className="truncate font-mono hover:text-cyan-300">settlement: {shortHash(payTx)} ↗</a>
              {hire.x402.settlementTx && <a href={txUrl("baseSepolia", hire.x402.settlementTx)} target="_blank" rel="noreferrer" className="truncate font-mono hover:text-cyan-300">x402: {shortHash(hire.x402.settlementTx)} ↗</a>}
            </div>
            <button onClick={reset} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 py-2.5 text-sm transition hover:bg-white/5">
              <Receipt size={14} /> New payment
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepRow({ done, active, label }: { done: boolean; active: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`flex h-4 w-4 items-center justify-center rounded-full ${done ? "bg-emerald-400 text-black" : active ? "bg-cyan-400/30 text-cyan-200" : "bg-white/10 text-white/30"}`}>
        {done ? <Check size={11} /> : active ? <Loader2 size={10} className="animate-spin" /> : <span className="h-1 w-1 rounded-full bg-current" />}
      </span>
      <span className={done ? "text-white/80" : active ? "text-cyan-200" : "text-white/40"}>{label}</span>
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
