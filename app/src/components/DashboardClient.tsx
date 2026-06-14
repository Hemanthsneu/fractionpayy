"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { ArrowUpRight, Wallet, TrendingUp, Coins, Building2, Bot, Nfc, Loader2, RefreshCw, CreditCard } from "lucide-react";
import { FundWallet } from "./FundWallet";
import { DonutChart, AreaChart, CountUp, type Segment } from "./Charts";

interface Position { symbol: string; balance: number; priceUsd: number; valueUsd: number; yieldBps: number }
interface Vault { tvlUsd: number; pricePerShare: number; totalFeesUsd: number; totalYieldPreservedUsd: number }

const ease = [0.16, 1, 0.3, 1] as const;
const PALETTE = ["#34d399", "#22d3ee", "#2dd4bf", "#a78bfa", "#fbbf24", "#f472b6", "#60a5fa"];
const SYMBOL_COLOR: Record<string, string> = { USDC: "#10b981", TBILL: "#22d3ee", XAUM: "#fbbf24", MREIT: "#a78bfa", AAPL30: "#f472b6", MMF: "#2dd4bf", MNHTN: "#60a5fa" };

// A smooth, deterministic 24-point trend that lands exactly on `total`.
function trendSeries(total: number): number[] {
  const shape = [0.74, 0.73, 0.76, 0.78, 0.77, 0.8, 0.82, 0.81, 0.84, 0.86, 0.85, 0.88, 0.9, 0.89, 0.92, 0.91, 0.94, 0.95, 0.97, 0.96, 0.98, 0.99, 0.995, 1];
  return shape.map((m) => Math.max(total * m, 0));
}

export function DashboardClient() {
  const { address: wagmiAddress } = useAccount();
  const { primaryWallet } = useDynamicContext();
  const address = (primaryWallet?.address ?? wagmiAddress) as `0x${string}` | undefined;

  const [positions, setPositions] = useState<Position[]>([]);
  const [usdc, setUsdc] = useState(0);
  const [vault, setVault] = useState<Vault | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!address) { setLoading(false); return; }
    setLoading(true);
    try {
      const [pf, vt] = await Promise.all([
        fetch(`/api/portfolio?address=${address}`, { cache: "no-store" }).then((r) => r.json()).catch(() => null),
        fetch(`/api/vault`, { cache: "no-store" }).then((r) => r.json()).catch(() => null),
      ]);
      setPositions(pf?.positions ?? []);
      setUsdc(pf?.usdcBalance ?? 0);
      setVault(vt && !vt.error ? vt : null);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  const held = positions.filter((p) => p.valueUsd > 0.01);
  const rwaValue = held.reduce((s, p) => s + p.valueUsd, 0);
  const total = rwaValue + usdc;
  const annualYield = held.reduce((s, p) => s + (p.valueUsd * p.yieldBps) / 10000, 0);
  const yieldPct = rwaValue > 0 ? (annualYield / rwaValue) * 100 : 0;
  const empty = !loading && total < 0.01;

  const segments: Segment[] = useMemo(() => {
    const segs: Segment[] = [];
    if (usdc > 0.01) segs.push({ label: "USDC", value: usdc, color: SYMBOL_COLOR.USDC });
    held.forEach((p, i) => segs.push({ label: p.symbol, value: p.valueUsd, color: SYMBOL_COLOR[p.symbol] ?? PALETTE[i % PALETTE.length] }));
    return segs;
  }, [usdc, held]);

  const series = useMemo(() => trendSeries(total || 1), [total]);

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-300/70">Portfolio</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Welcome back 👋</h1>
          <p className="mt-1 text-sm text-white/45">
            {address ? <>Self-custodied on Arc · <span className="font-mono">{address.slice(0, 6)}…{address.slice(-4)}</span></> : "Connect a wallet to begin."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={load} disabled={loading} className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/10 disabled:opacity-50">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <Link href="/marketplace" className="rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-black transition hover:opacity-90">+ Invest</Link>
          <Link href="/pay/coffeeshop.fractionpay.eth" className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/85 transition hover:bg-white/5">Pay</Link>
        </div>
      </div>

      {empty && (
        <Glass className="border-emerald-300/30 bg-emerald-400/[0.07]">
          <p className="font-semibold text-emerald-200">Your wallet has no assets on Arc yet.</p>
          <p className="mt-1 text-sm text-white/55">Arc uses USDC for gas — fund your wallet with test gas + USDC + a starter RWA basket, then everything is signed by you.</p>
          <div className="mt-4"><FundWallet compact onFunded={() => setTimeout(load, 1600)} /></div>
        </Glass>
      )}

      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="animate-spin text-emerald-300" /></div>
      ) : (
        <>
          {/* hero: value chart + allocation donut */}
          <div className="grid gap-5 lg:grid-cols-3">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="lg:col-span-2 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-white/40">Total portfolio value</p>
                  <p className="mt-1 font-display text-4xl font-bold sm:text-5xl">$<CountUp to={total} decimals={total < 1000 ? 2 : 0} /></p>
                  <p className="mt-1 flex items-center gap-1 text-sm text-emerald-300"><TrendingUp size={14} /> {yieldPct.toFixed(1)}% blended APY · ${annualYield.toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr</p>
                </div>
                <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium text-emerald-300">spendable</span>
              </div>
              <div className="mt-4">
                <AreaChart data={series} color="#34d3ee" />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease, delay: 0.08 }} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-wider text-white/40">Allocation</p>
              <div className="mt-3 flex flex-col items-center gap-4">
                {segments.length > 0 ? (
                  <DonutChart segments={segments} size={176} centerLabel={`$${(total / 1000).toFixed(1)}k`} centerSub="total" />
                ) : (
                  <p className="py-10 text-sm text-white/40">No assets yet</p>
                )}
                <div className="grid w-full grid-cols-2 gap-x-3 gap-y-1.5">
                  {segments.map((s) => (
                    <div key={s.label} className="flex items-center gap-1.5 text-xs text-white/60">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                      <span className="font-medium text-white/80">{s.label}</span>
                      <span className="ml-auto font-mono text-white/40">{((s.value / (total || 1)) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* stat strip */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat icon={<CreditCard size={18} />} label="Cash (USDC)" value={<>$<CountUp to={usdc} decimals={2} /></>} sub="spendable + dividends" />
            <Stat icon={<Wallet size={18} />} label="RWA holdings" value={<>$<CountUp to={rwaValue} decimals={0} /></>} sub={`${held.length} assets`} />
            <Stat icon={<Coins size={18} />} label="Vault TVL" value={vault ? <>$<CountUp to={vault.tvlUsd} decimals={0} /></> : "—"} sub={vault ? `$${vault.totalFeesUsd.toFixed(2)} fees to LPs` : ""} />
            <Stat icon={<TrendingUp size={18} />} label="Annual yield" value={<>$<CountUp to={annualYield} decimals={0} /></>} sub={`${yieldPct.toFixed(1)}% APY`} />
          </div>

          {/* holdings + actions */}
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">Holdings</h2>
                <Link href="/marketplace" className="text-xs text-emerald-300 hover:underline">Invest more →</Link>
              </div>
              {segments.length === 0 ? (
                <p className="py-10 text-center text-sm text-white/40">No holdings yet — fund your wallet or invest.</p>
              ) : (
                <div className="mt-4 space-y-1">
                  <div className="grid grid-cols-[1.4fr_1fr_1fr_0.7fr] px-3 pb-2 text-[10px] uppercase tracking-wider text-white/30">
                    <span>Asset</span><span className="text-right">Price</span><span className="text-right">Value</span><span className="text-right">Yield</span>
                  </div>
                  {usdc > 0.01 && <HoldingRow color={SYMBOL_COLOR.USDC} symbol="USDC" meta="cash" price="$1.00" value={usdc} yieldStr="—" />}
                  {held.map((p) => (
                    <HoldingRow key={p.symbol} color={SYMBOL_COLOR[p.symbol] ?? "#34d399"} symbol={p.symbol} meta={`${p.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} units`} price={`$${p.priceUsd.toLocaleString()}`} value={p.valueUsd} yieldStr={p.yieldBps > 0 ? `${(p.yieldBps / 100).toFixed(2)}%` : "—"} />
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
              <h2 className="font-display text-lg font-semibold">Quick actions</h2>
              <div className="mt-4 space-y-2">
                <ActionLink href="/property" icon={<Building2 size={16} />} title="Property dividends" sub="Distribute / claim USDC" />
                <ActionLink href="/pay/coffeeshop.fractionpay.eth" icon={<Nfc size={16} />} title="Tap to pay" sub="NFC → agent → Arc" />
                <ActionLink href="/agents" icon={<Bot size={16} />} title="Agent leaderboard" sub="BigQuery reputation, live" />
                <ActionLink href="/admin" icon={<ArrowUpRight size={16} />} title="Issuer dashboard" sub="Tokenize a new asset" />
              </div>
            </div>
          </div>

          {vault && (
            <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:grid-cols-4">
              <Mini label="Liquidity vault TVL" value={`$${vault.tvlUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
              <Mini label="NAV per LP share" value={`$${vault.pricePerShare.toFixed(4)}`} />
              <Mini label="Protocol fees (LPs)" value={`$${vault.totalFeesUsd.toFixed(2)}`} />
              <Mini label="Yield preserved by agent" value={`$${vault.totalYieldPreservedUsd.toFixed(2)}/yr`} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Glass({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl ${className}`}>{children}</div>;
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className="flex items-center gap-2 text-white/50">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="mt-3 font-display text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-xs text-white/40">{sub}</p>
    </motion.div>
  );
}

function HoldingRow({ color, symbol, meta, price, value, yieldStr }: { color: string; symbol: string; meta: string; price: string; value: number; yieldStr: string }) {
  return (
    <div className="grid grid-cols-[1.4fr_1fr_1fr_0.7fr] items-center rounded-xl px-3 py-2.5 transition hover:bg-white/[0.04]">
      <div className="flex items-center gap-2.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        <div>
          <div className="text-sm font-semibold">{symbol}</div>
          <div className="text-[11px] text-white/35">{meta}</div>
        </div>
      </div>
      <span className="text-right text-sm text-white/50">{price}</span>
      <span className="text-right text-sm font-semibold">${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
      <span className="text-right">
        {yieldStr !== "—" ? <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs font-medium text-emerald-300">{yieldStr}</span> : <span className="text-xs text-white/30">—</span>}
      </span>
    </div>
  );
}

function ActionLink({ href, icon, title, sub }: { href: string; icon: React.ReactNode; title: string; sub: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition hover:border-emerald-300/30 hover:bg-emerald-400/[0.06]">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-emerald-300 transition group-hover:bg-emerald-400/15">{icon}</span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-white/40">{sub}</p>
      </div>
      <ArrowUpRight size={15} className="ml-auto text-white/20 transition group-hover:text-white/50" />
    </Link>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-white/40">{label}</p>
      <p className="mt-1 font-display text-lg font-bold">{value}</p>
    </div>
  );
}
