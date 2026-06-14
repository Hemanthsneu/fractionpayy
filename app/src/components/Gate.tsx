"use client";

import { useDynamicContext, useIsLoggedIn } from "@dynamic-labs/sdk-react-core";
import { motion } from "framer-motion";
import { Lock, ShieldAlert, Loader2, Wallet } from "lucide-react";

const ADMINS = (process.env.NEXT_PUBLIC_ADMIN_ADDRESS ?? "")
  .toLowerCase()
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function GateCard({
  icon,
  title,
  subtitle,
  cta,
  onClick,
  tone = "emerald",
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  cta?: string;
  onClick?: () => void;
  tone?: "emerald" | "amber";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto mt-10 max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center backdrop-blur-xl"
    >
      <span
        className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${
          tone === "amber"
            ? "bg-amber-400/10 text-amber-300"
            : "bg-emerald-400/10 text-emerald-300"
        }`}
      >
        {icon}
      </span>
      <h2 className="mt-5 font-display text-2xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-white/55">{subtitle}</p>
      {cta && onClick && (
        <button
          onClick={onClick}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-6 py-3 font-semibold text-black transition hover:opacity-90"
        >
          <Wallet size={16} /> {cta}
        </button>
      )}
    </motion.div>
  );
}

function Loading() {
  return (
    <div className="mt-16 flex justify-center">
      <Loader2 className="animate-spin text-emerald-300" size={28} />
    </div>
  );
}

/** Requires ANY connected wallet — the logged-in user/investor experience. */
export function WalletGate({
  children,
  title = "Connect your wallet",
  subtitle = "Connect a wallet to view your portfolio and invest. Your assets stay self-custodied.",
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const isLoggedIn = useIsLoggedIn();
  const { sdkHasLoaded, setShowAuthFlow } = useDynamicContext();

  if (!sdkHasLoaded) return <Loading />;
  if (!isLoggedIn)
    return (
      <GateCard
        icon={<Lock size={24} />}
        title={title}
        subtitle={subtitle}
        cta="Connect wallet"
        onClick={() => setShowAuthFlow(true)}
      />
    );
  return <>{children}</>;
}

/** Requires the connected wallet to be an authorized admin (issuer) address. */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useIsLoggedIn();
  const { sdkHasLoaded, primaryWallet, setShowAuthFlow } = useDynamicContext();
  const addr = primaryWallet?.address?.toLowerCase();

  if (!sdkHasLoaded) return <Loading />;
  if (!isLoggedIn || !addr)
    return (
      <GateCard
        icon={<Lock size={24} />}
        title="Issuer access only"
        subtitle="Connect the admin wallet to tokenize and manage real-world assets."
        cta="Connect admin wallet"
        onClick={() => setShowAuthFlow(true)}
      />
    );
  if (ADMINS.length > 0 && !ADMINS.includes(addr))
    return (
      <GateCard
        tone="amber"
        icon={<ShieldAlert size={24} />}
        title="Not an authorized issuer"
        subtitle={`Connected as ${addr.slice(0, 6)}…${addr.slice(-4)}. Switch to the admin wallet to access the issuer dashboard.`}
      />
    );
  return <>{children}</>;
}
