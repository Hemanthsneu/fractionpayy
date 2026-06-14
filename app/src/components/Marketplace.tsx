"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { parseUnits } from "viem";
import { Loader2, CheckCircle2, TrendingUp, ExternalLink } from "lucide-react";
import { addressUrl, txUrl, shortHash } from "@/lib/explorer";
import { deployments } from "@/lib/deployments";
import { marketAbi, erc20Abi } from "@/lib/contracts";
import { useArc } from "@/lib/useArc";
import { FundWallet } from "./FundWallet";

interface Asset {
  symbol: string;
  name: string;
  token: string;
  assetType: string;
  emoji: string;
  yieldPct: number;
  pricePerShareUsd: number;
}

const TYPE_LABEL: Record<string, string> = {
  treasury: "Treasury",
  commodity: "Commodity",
  "real-estate": "Real Estate",
  bond: "Bond",
  fund: "Fund",
  other: "RWA",
};

const dep = deployments.arcTestnet;

export function Marketplace({ assets }: { assets: Asset[] }) {
  const { isConnected, write } = useArc();
  const [busy, setBusy] = useState<string>("");
  const [statusStep, setStatusStep] = useState<string>("");
  const [flash, setFlash] = useState<{ msg: string; tx: string } | null>(null);
  const [error, setError] = useState<string>("");
  const [amount, setAmount] = useState<Record<string, string>>({});

  async function invest(a: Asset) {
    const usd = Number(amount[a.token] ?? 1000);
    if (!usd || usd <= 0) return setError("Enter an amount");
    setBusy(a.token);
    setError("");
    setFlash(null);
    try {
      const amt = parseUnits(String(usd), 6);
      // 1) approve the market to pull your USDC — signed by YOUR wallet
      setStatusStep("Approve USDC in your wallet…");
      await write({ address: dep.usdc, abi: erc20Abi, functionName: "approve", args: [dep.market, amt] });
      // 2) invest → mints fractional shares to YOUR wallet
      setStatusStep("Confirm investment in your wallet…");
      const tx = await write({ address: dep.market, abi: marketAbi, functionName: "invest", args: [a.token, amt] });
      const shares = a.pricePerShareUsd > 0 ? (usd / a.pricePerShareUsd).toFixed(4) : "?";
      setFlash({ msg: `Bought ${shares} ${a.symbol} shares for $${usd} — minted to your wallet ✓`, tx });
    } catch (e) {
      setError((e as Error).message.split("\n")[0]);
    } finally {
      setBusy("");
      setStatusStep("");
    }
  }

  return (
    <div>
      {isConnected && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-[var(--fg)]/5 px-4 py-2.5 text-sm text-[var(--fg)]/60">
          <span>New here? Top up your Arc wallet first:</span>
          <FundWallet compact />
        </div>
      )}

      {flash && (
        <p className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-[var(--citrus)]/10 px-4 py-2 text-sm text-[var(--citrus)]">
          <CheckCircle2 size={15} /> {flash.msg}
          <a href={txUrl("arc", flash.tx)} target="_blank" rel="noreferrer" className="flex items-center gap-1 underline">
            {shortHash(flash.tx)} <ExternalLink size={11} />
          </a>
        </p>
      )}
      {error && <p className="mb-4 rounded-xl bg-red-400/10 px-4 py-2 text-sm text-red-400">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {assets.map((a) => (
          <motion.div
            key={a.token}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col rounded-2xl border border-[var(--fg)]/10 bg-[var(--fg)]/5 p-5 backdrop-blur"
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl">{a.emoji}</span>
              <span className="rounded-full bg-[var(--fg)]/5 px-2 py-1 text-[10px] uppercase tracking-wide text-[var(--fg)]/50">
                {TYPE_LABEL[a.assetType] ?? a.assetType}
              </span>
            </div>
            <p className="mt-3 font-semibold">{a.name}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-[var(--fg)]/50">
              <span className="font-mono">${a.pricePerShareUsd.toLocaleString()}/share</span>
              {a.yieldPct > 0 && (
                <span className="flex items-center gap-0.5 text-[var(--citrus)]">
                  <TrendingUp size={11} /> {a.yieldPct}% APY
                </span>
              )}
            </div>
            <a
              href={addressUrl("arc", a.token)}
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 flex items-center gap-1 font-mono text-[11px] text-[var(--fg)]/35 transition hover:text-[var(--sage)]"
              title="View token contract on Arc explorer"
            >
              {shortHash(a.token)} <ExternalLink size={10} />
            </a>

            <div className="mt-4 flex items-center gap-2">
              <div className="flex items-center rounded-lg bg-[var(--fg)]/5 px-2">
                <span className="text-[var(--fg)]/40">$</span>
                <input
                  value={amount[a.token] ?? "1000"}
                  onChange={(e) => setAmount((m) => ({ ...m, [a.token]: e.target.value }))}
                  inputMode="numeric"
                  className="w-16 bg-transparent py-2 text-sm outline-none"
                />
              </div>
              <button
                onClick={() => invest(a)}
                disabled={busy !== ""}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[var(--citrus)] to-[var(--sage)] py-2 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-40"
              >
                {busy === a.token ? <Loader2 size={14} className="animate-spin" /> : null}
                Invest
              </button>
            </div>
            {busy === a.token && statusStep && (
              <p className="mt-2 text-center text-[11px] text-[var(--sage)]">{statusStep}</p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
