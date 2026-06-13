import { headers } from "next/headers";
import { PropertyDividends } from "@/components/PropertyDividends";

export const dynamic = "force-dynamic";

async function loadProperty() {
  const h = await headers();
  const host = h.get("host");
  const proto = host?.includes("localhost") ? "http" : "https";
  const res = await fetch(`${proto}://${host}/api/property`, { cache: "no-store" });
  return res.json();
}

export default async function PropertyPage() {
  const state = await loadProperty();

  return (
    <div>
      <header className="mb-8">
        <p className="text-sm uppercase tracking-widest text-emerald-300/80">
          Tokenize → Earn → Spend
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Tokenized real estate</h1>
        <p className="mt-2 max-w-2xl text-white/50">
          A commercial property, tokenized into fractional shares and distributed to investors.
          Rental income is paid as <span className="text-emerald-300">stablecoin dividends</span>{" "}
          pro-rata on Arc — and the same shares are spendable through the FractionPay vault.
        </p>
      </header>
      {state?.error ? (
        <p className="text-red-400">Could not load property: {state.error}</p>
      ) : (
        <PropertyDividends initial={state} />
      )}
    </div>
  );
}
