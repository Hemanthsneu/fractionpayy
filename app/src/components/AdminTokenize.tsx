"use client";

import { useState } from "react";
import Link from "next/link";
import { parseAbi } from "viem";
import { Loader2, CheckCircle2, Factory, ExternalLink, ArrowRight } from "lucide-react";
import { addressUrl, txUrl, shortHash } from "@/lib/explorer";
import { deployments } from "@/lib/deployments";
import { vaultAbi, marketAbi } from "@/lib/contracts";
import { MOCK_RWA_BYTECODE, YIELD_AGG_BYTECODE } from "@/lib/artifacts";
import { useArc } from "@/lib/useArc";

const TYPES = ["real-estate", "treasury", "bond", "fund", "commodity"];
const dep = deployments.arcTestnet;
const rwaCtorAbi = parseAbi(["constructor(string name, string symbol, uint16 yieldBps)"]);
const aggCtorAbi = parseAbi(["constructor(int256 basePrice, uint16 apyBps, string desc)"]);

interface TokenizeResult {
  token: string;
  feed: string;
  txs: { token: string; feed: string; register: string; list: string };
}

export function AdminTokenize() {
  const { deploy, write } = useArc();
  const [form, setForm] = useState({
    name: "Brooklyn Warehouse REIT",
    symbol: "BKWH",
    assetType: "real-estate",
    priceUsd: "250",
    yieldPct: "7.2",
  });
  const [busy, setBusy] = useState(false);
  const [statusStep, setStatusStep] = useState("");
  const [result, setResult] = useState<TokenizeResult | null>(null);
  const [error, setError] = useState("");

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function tokenize() {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const apyBps = Math.round(Number(form.yieldPct || 5) * 100);
      const basePrice = BigInt(Math.round(Number(form.priceUsd || 100) * 1e8)); // 8-dec USD

      // 1) deploy the fractional share token (signed by the issuer wallet)
      setStatusStep("Deploy share token in your wallet…");
      const token = await deploy({ abi: rwaCtorAbi, bytecode: MOCK_RWA_BYTECODE as `0x${string}`, args: [form.name, form.symbol, apyBps] });

      // 2) deploy its price feed
      setStatusStep("Deploy price feed…");
      const feed = await deploy({ abi: aggCtorAbi, bytecode: YIELD_AGG_BYTECODE as `0x${string}`, args: [basePrice, apyBps, `${form.symbol}/USD`] });

      // 3) register it as spendable in the vault (onlyOwner = your wallet)
      setStatusStep("Register it in the vault…");
      const register = await write({ address: dep.vault, abi: vaultAbi, functionName: "registerRWA", args: [token.address, feed.address, apyBps] });

      // 4) list it on the marketplace (onlyOwner = your wallet)
      setStatusStep("List it on the marketplace…");
      const list = await write({ address: dep.market, abi: marketAbi, functionName: "list", args: [token.address, feed.address, apyBps, form.assetType, form.name] });

      setResult({ token: token.address, feed: feed.address, txs: { token: token.hash, feed: feed.hash, register, list } });
    } catch (e) {
      setError((e as Error).message.split("\n")[0]);
    } finally {
      setBusy(false);
      setStatusStep("");
    }
  }

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-[var(--fg)]/10 bg-[var(--fg)]/5 p-6 backdrop-blur">
      <div className="flex items-center gap-2">
        <Factory className="text-[var(--citrus)]" size={20} />
        <h2 className="font-semibold">Tokenize a new RWA</h2>
      </div>
      <p className="mt-1 text-sm text-[var(--fg)]/50">
        Deploys a fractional share token + price feed on Arc, registers it as spendable in the
        vault, and lists it on the marketplace — every step signed by your issuer wallet.
      </p>

      <div className="mt-5 space-y-3">
        <Field label="Asset name" value={form.name} onChange={(v) => set("name", v)} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Symbol" value={form.symbol} onChange={(v) => set("symbol", v.toUpperCase())} />
          <div>
            <label className="text-xs text-[var(--fg)]/50">Type</label>
            <select value={form.assetType} onChange={(e) => set("assetType", e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--fg)]/10 bg-slate-900 px-3 py-2 text-sm outline-none">
              {TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price / share ($)" value={form.priceUsd} onChange={(v) => set("priceUsd", v)} />
          <Field label="Yield APY (%)" value={form.yieldPct} onChange={(v) => set("yieldPct", v)} />
        </div>
      </div>

      <button onClick={tokenize} disabled={busy} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--citrus)] to-[var(--sage)] py-3 font-semibold text-black transition hover:opacity-90 disabled:opacity-40">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Factory size={16} />}
        {busy ? "Deploying on Arc…" : "Tokenize & list"}
      </button>
      {busy && statusStep && <p className="mt-2 text-center text-xs text-[var(--sage)]">{statusStep}</p>}

      {result && (
        <div className="mt-4 rounded-xl border border-[var(--citrus)]/20 bg-[var(--citrus)]/10 p-4 text-sm text-[var(--citrus)]">
          <p className="flex items-center gap-1.5 font-medium"><CheckCircle2 size={15} /> Tokenized & listed on Arc ✓</p>
          <div className="mt-3 space-y-1.5">
            <ExplorerRow label="Share token" kind="address" value={result.token} />
            <ExplorerRow label="Price feed" kind="address" value={result.feed} />
            <ExplorerRow label="Deploy tx" kind="tx" value={result.txs.token} />
            <ExplorerRow label="List tx" kind="tx" value={result.txs.list} />
          </div>
          <Link href="/marketplace" className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--sage)] hover:underline">
            See it live in the marketplace <ArrowRight size={12} />
          </Link>
        </div>
      )}
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
    </div>
  );
}

function ExplorerRow({ label, kind, value }: { label: string; kind: "address" | "tx"; value: string }) {
  const href = kind === "address" ? addressUrl("arc", value) : txUrl("arc", value);
  return (
    <a href={href} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-1.5 transition hover:bg-black/30">
      <span className="text-[11px] text-[var(--fg)]/50">{label}</span>
      <span className="flex items-center gap-1 font-mono text-[11px] text-[var(--sage)]">{shortHash(value)} <ExternalLink size={10} /></span>
    </a>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-xs text-[var(--fg)]/50">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--fg)]/10 bg-[var(--fg)]/5 px-3 py-2 text-sm outline-none focus:border-[var(--citrus)]/40" />
    </div>
  );
}
