import { AdminTokenize } from "@/components/AdminTokenize";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return (
    <div>
      <header className="mb-8">
        <p className="text-sm uppercase tracking-widest text-emerald-300/80">Issuer dashboard</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Tokenize a real-world asset</h1>
        <p className="mt-2 max-w-2xl text-white/50">
          Issuers tokenize properties, treasuries, bonds, and funds into fractional shares —
          deployed on Arc, registered as spendable in the vault, and listed for investors.
        </p>
      </header>
      <AdminTokenize />
    </div>
  );
}
