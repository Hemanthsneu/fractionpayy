import { notFound } from "next/navigation";
import { resolveMerchant } from "@/lib/merchants";
import { PaymentFlow } from "@/components/PaymentFlow";

export const dynamic = "force-dynamic";

export default async function PayPage({
  params,
}: {
  params: Promise<{ merchant: string }>;
}) {
  const { merchant: name } = await params;
  const merchant = await resolveMerchant(name);
  if (!merchant) notFound();

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur">
        <span className="text-5xl">{merchant.emoji}</span>
        <h1 className="mt-3 text-2xl font-bold">{merchant.displayName}</h1>
        <p className="mt-1 font-mono text-sm text-emerald-300">{merchant.ensName}</p>
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-white/40">
          <span className="rounded-full bg-white/5 px-2 py-1">
            accepts {merchant.acceptedTokens.join(", ")}
          </span>
          <span className="rounded-full bg-white/5 px-2 py-1">{merchant.chain}</span>
          <span
            className={`rounded-full px-2 py-1 ${
              merchant.source === "ens"
                ? "bg-emerald-400/10 text-emerald-300"
                : "bg-white/5"
            }`}
          >
            {merchant.source === "ens" ? "✓ resolved via ENS" : "registry"}
          </span>
        </div>
        <p className="mt-2 truncate font-mono text-[10px] text-white/30">{merchant.address}</p>
      </div>

      <PaymentFlow merchant={merchant} />
    </div>
  );
}
