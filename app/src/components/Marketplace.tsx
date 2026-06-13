"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, TrendingUp } from "lucide-react";

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

export function Marketplace({ assets }: { assets: Asset[] }) {
  const [busy, setBusy] = useState<string>("");
  const [flash, setFlash] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [amount, setAmount] = useState<Record<string, string>>({});

  async function invest(a: Asset) {
    const usd = Number(amount[a.token] ?? 1000);
    setBusy(a.token);
    setError("");
    setFlash("");
    try {
      const res = await fetch("/api/invest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: a.token, usdcAmount: usd }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "invest failed");
      const shares = a.pricePerShareUsd > 0 ? (usd / a.pricePerShareUsd).toFixed(4) : "?";
      setFlash(`Bought ${shares} ${a.symbol} shares for $${usd} — added to your portfolio ✓`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  return (
    <div>
      {flash && (
        <p className="mb-4 flex items-center gap-1.5 rounded-xl bg-emerald-400/10 px-4 py-2 text-sm text-emerald-300">
          <CheckCircle2 size={15} /> {flash}
        </p>
      )}
      {error && <p className="mb-4 rounded-xl bg-red-400/10 px-4 py-2 text-sm text-red-400">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {assets.map((a) => (
          <motion.div
            key={a.token}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur"
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl">{a.emoji}</span>
              <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] uppercase tracking-wide text-white/50">
                {TYPE_LABEL[a.assetType] ?? a.assetType}
              </span>
            </div>
            <p className="mt-3 font-semibold">{a.name}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-white/50">
              <span className="font-mono">${a.pricePerShareUsd.toLocaleString()}/share</span>
              {a.yieldPct > 0 && (
                <span className="flex items-center gap-0.5 text-emerald-300">
                  <TrendingUp size={11} /> {a.yieldPct}% APY
                </span>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <div className="flex items-center rounded-lg bg-white/5 px-2">
                <span className="text-white/40">$</span>
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
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-400 to-cyan-400 py-2 text-sm font-semibold text-black transition hover:opacity-90 disabled:opacity-40"
              >
                {busy === a.token ? <Loader2 size={14} className="animate-spin" /> : null}
                Invest
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
