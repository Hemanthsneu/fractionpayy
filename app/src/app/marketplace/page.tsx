import Link from "next/link";
import { headers } from "next/headers";
import { Marketplace } from "@/components/Marketplace";
import { WalletGate } from "@/components/Gate";

export const dynamic = "force-dynamic";

async function load() {
  const h = await headers();
  const host = h.get("host");
  const proto = host?.includes("localhost") ? "http" : "https";
  const res = await fetch(`${proto}://${host}/api/marketplace`, { cache: "no-store" });
  return res.json();
}

export default async function MarketplacePage() {
  const data = await load();
  return (
    <div>
      <header className="mb-8">
        <p className="text-sm uppercase tracking-widest text-[var(--citrus)]/80">Primary market</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Invest in tokenized RWAs</h1>
        <p className="mt-2 max-w-2xl text-[var(--fg)]/50">
          Buy fractional shares of real-world assets with USDC — real estate, treasuries, bonds,
          funds, commodities. Shares land in your portfolio, earn yield, and stay spendable
          anywhere via FractionPay.{" "}
          <Link href="/admin" className="text-[var(--sage)] hover:underline">
            Issuer? Tokenize an asset →
          </Link>
        </p>
      </header>
      <WalletGate subtitle="Connect a wallet to invest in tokenized real-world assets. Shares mint to your portfolio and stay spendable via FractionPay.">
        {data?.error ? (
          <p className="text-red-400">Could not load marketplace: {data.error}</p>
        ) : (
          <Marketplace assets={data.assets ?? []} />
        )}
      </WalletGate>
    </div>
  );
}
