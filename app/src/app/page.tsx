import Link from "next/link";
import { getPortfolio } from "@/lib/portfolio";
import { demoWallets } from "@/lib/deployments";
import { demoMerchants } from "@/lib/merchants";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const positions = await getPortfolio(demoWallets.buyer);
  const total = positions.reduce((s, p) => s + p.valueUsd, 0);

  return (
    <div>
      <header className="mb-10">
        <p className="text-sm uppercase tracking-widest text-emerald-300/80">Portfolio</p>
        <h1 className="mt-1 text-5xl font-bold tracking-tight">
          ${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </h1>
        <p className="mt-2 text-white/50">
          Tokenized real-world assets on Arc — spendable at any merchant, optimized by an
          on-chain agent economy.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {positions.map((p) => (
          <div
            key={p.symbol}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition hover:border-emerald-300/30"
          >
            <div className="flex items-baseline justify-between">
              <span className="font-semibold">{p.symbol}</span>
              <span className="text-xs text-white/40">${p.priceUsd.toLocaleString()}/unit</span>
            </div>
            <p className="mt-3 text-2xl font-bold">
              ${p.valueUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="mt-1 text-xs text-white/50">
              {p.balance.toLocaleString()} units ·{" "}
              {p.yieldBps > 0 ? (
                <span className="text-emerald-300">{(p.yieldBps / 100).toFixed(2)}% APY</span>
              ) : (
                <span>no yield</span>
              )}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-white/80">Demo merchants — tap a card</h2>
        <p className="mt-1 text-sm text-white/40">
          In the live demo these open via NFC tap or QR scan.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {demoMerchants.map((m) => (
            <Link
              key={m.ensName}
              href={`/pay/${m.ensName}`}
              className="group rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition hover:border-cyan-300/40 hover:bg-white/10"
            >
              <span className="text-3xl">{m.emoji}</span>
              <p className="mt-2 font-semibold group-hover:text-cyan-200">{m.displayName}</p>
              <p className="mt-0.5 truncate font-mono text-xs text-white/40">{m.ensName}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
