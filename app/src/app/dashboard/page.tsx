import Link from "next/link";
import { getPortfolio } from "@/lib/portfolio";
import { getVaultStats } from "@/lib/vault";
import { demoWallets } from "@/lib/deployments";
import { ArrowUpRight, Wallet, TrendingUp, Coins, Building2, Bot, Nfc } from "lucide-react";

export const dynamic = "force-dynamic";

const SPARK = "M0 28 L20 22 L40 25 L60 14 L80 18 L100 8 L120 12 L140 4";

export default async function Dashboard() {
  const [positions, vault] = await Promise.all([
    getPortfolio(demoWallets.buyer),
    getVaultStats().catch(() => null),
  ]);
  const total = positions.reduce((s, p) => s + p.valueUsd, 0);
  const annualYield = positions.reduce((s, p) => s + (p.valueUsd * p.yieldBps) / 10000, 0);
  const yieldPct = total > 0 ? (annualYield / total) * 100 : 0;

  return (
    <div className="rounded-[28px] bg-[#eef1ea] p-5 text-slate-900 sm:p-7">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Welcome back 👋</h1>
          <p className="mt-1 text-sm text-slate-500">
            Your tokenized portfolio — earning yield, ready to spend.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/marketplace"
            className="rounded-xl bg-[#24351f] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            + Invest
          </Link>
          <Link
            href="/pay/coffeeshop.fractionpay.eth"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50"
          >
            Pay
          </Link>
        </div>
      </div>

      {/* top grid: 3 stats + card */}
      <div className="mt-6 grid gap-4 lg:grid-cols-4">
        <StatCard
          icon={<Wallet size={18} />}
          label="Portfolio Value"
          value={`$${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          delta="+12.4% from last month"
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Annual Yield"
          value={`$${annualYield.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          delta={`${yieldPct.toFixed(1)}% blended APY`}
        />
        <StatCard
          icon={<Coins size={18} />}
          label="Vault TVL"
          value={vault ? `$${vault.tvlUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—"}
          delta={vault ? `$${vault.totalFeesUsd.toFixed(2)} fees to LPs` : ""}
        />
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2b3d22] to-[#16210f] p-5 text-white">
          <div className="flex items-center justify-between text-xs text-white/70">
            <span>FractionPay</span>
            <span>RWA</span>
          </div>
          <p className="mt-5 font-mono text-base tracking-widest">3827 •••• •••• 7389</p>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <p className="text-[10px] text-white/50">Total Balance</p>
              <p className="text-xl font-bold">
                ${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] text-emerald-200">
              spendable
            </span>
          </div>
        </div>
      </div>

      {/* holdings + actions */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Holdings</h2>
            <Link href="/marketplace" className="text-xs text-[#2b6b3f] hover:underline">
              Invest more →
            </Link>
          </div>
          <table className="mt-4 w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="pb-2">Asset</th>
                <th className="pb-2 text-right">Price</th>
                <th className="pb-2 text-right">Value</th>
                <th className="pb-2 text-right">Yield</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={p.symbol} className="border-t border-slate-100">
                  <td className="py-3">
                    <div className="font-medium">{p.symbol}</div>
                    <div className="text-xs text-slate-400">
                      {p.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} units
                    </div>
                  </td>
                  <td className="py-3 text-right text-slate-500">${p.priceUsd.toLocaleString()}</td>
                  <td className="py-3 text-right font-semibold">
                    ${p.valueUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className="py-3 text-right">
                    {p.yieldBps > 0 ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        {(p.yieldBps / 100).toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl bg-white p-5">
          <h2 className="font-semibold">Quick actions</h2>
          <div className="mt-4 space-y-2">
            <ActionLink href="/property" icon={<Building2 size={16} />} title="Property dividends" sub="Distribute / claim USDC" />
            <ActionLink href="/pay/coffeeshop.fractionpay.eth" icon={<Nfc size={16} />} title="Tap to pay" sub="NFC → agent → Arc" />
            <ActionLink href="/agents" icon={<Bot size={16} />} title="Agent leaderboard" sub="BigQuery reputation, live" />
            <ActionLink href="/admin" icon={<ArrowUpRight size={16} />} title="Issuer dashboard" sub="Tokenize a new asset" />
          </div>
        </div>
      </div>

      {vault && (
        <div className="mt-4 grid gap-4 rounded-2xl bg-white p-5 sm:grid-cols-4">
          <Mini label="Liquidity vault TVL" value={`$${vault.tvlUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
          <Mini label="NAV per LP share" value={`$${vault.pricePerShare.toFixed(4)}`} />
          <Mini label="Protocol fees (LPs)" value={`$${vault.totalFeesUsd.toFixed(2)}`} />
          <Mini label="Yield preserved by agent" value={`$${vault.totalYieldPreservedUsd.toFixed(2)}/yr`} />
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, delta }: { icon: React.ReactNode; label: string; value: string; delta: string }) {
  return (
    <div className="rounded-2xl bg-white p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#24351f] text-white">{icon}</span>
        <span className="text-sm font-medium text-slate-600">{label}</span>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <p className="text-2xl font-bold">{value}</p>
        <svg viewBox="0 0 140 32" className="h-8 w-24 text-emerald-500/70">
          <path d={SPARK} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <p className="mt-1 text-xs text-emerald-600">{delta}</p>
    </div>
  );
}

function ActionLink({ href, icon, title, sub }: { href: string; icon: React.ReactNode; title: string; sub: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-[#2b6b3f]/30 hover:bg-emerald-50/40"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-[#2b6b3f]">{icon}</span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-slate-400">{sub}</p>
      </div>
      <ArrowUpRight size={15} className="ml-auto text-slate-300" />
    </Link>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}
