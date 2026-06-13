"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, Factory } from "lucide-react";

const TYPES = ["real-estate", "treasury", "bond", "fund", "commodity"];

export function AdminTokenize() {
  const [form, setForm] = useState({
    name: "Brooklyn Warehouse REIT",
    symbol: "BKWH",
    assetType: "real-estate",
    priceUsd: "250",
    yieldPct: "7.2",
  });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ token: string; feed: string } | null>(null);
  const [error, setError] = useState("");

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function tokenize() {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/admin/tokenize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? "tokenize failed");
      setResult({ token: data.token, feed: data.feed });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <div className="flex items-center gap-2">
        <Factory className="text-emerald-300" size={20} />
        <h2 className="font-semibold">Tokenize a new RWA</h2>
      </div>
      <p className="mt-1 text-sm text-white/50">
        Deploys a fractional share token + price feed on Arc, registers it as spendable in the
        vault, and lists it on the marketplace — all on-chain.
      </p>

      <div className="mt-5 space-y-3">
        <Field label="Asset name" value={form.name} onChange={(v) => set("name", v)} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Symbol" value={form.symbol} onChange={(v) => set("symbol", v.toUpperCase())} />
          <div>
            <label className="text-xs text-white/50">Type</label>
            <select
              value={form.assetType}
              onChange={(e) => set("assetType", e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price / share ($)" value={form.priceUsd} onChange={(v) => set("priceUsd", v)} />
          <Field label="Yield APY (%)" value={form.yieldPct} onChange={(v) => set("yieldPct", v)} />
        </div>
      </div>

      <button
        onClick={tokenize}
        disabled={busy}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 py-3 font-semibold text-black transition hover:opacity-90 disabled:opacity-40"
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Factory size={16} />}
        {busy ? "Deploying on Arc…" : "Tokenize & list"}
      </button>

      {result && (
        <div className="mt-4 rounded-xl bg-emerald-400/10 p-3 text-sm text-emerald-300">
          <p className="flex items-center gap-1.5">
            <CheckCircle2 size={15} /> Tokenized & listed on the marketplace ✓
          </p>
          <p className="mt-1 truncate font-mono text-[11px] text-white/60">token: {result.token}</p>
          <p className="truncate font-mono text-[11px] text-white/60">feed: {result.feed}</p>
        </div>
      )}
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs text-white/50">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-emerald-300/40"
      />
    </div>
  );
}
