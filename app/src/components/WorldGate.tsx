"use client";

import { IDKitWidget, VerificationLevel, type ISuccessResult } from "@worldcoin/idkit";
import { ShieldCheck, UserCheck } from "lucide-react";

const APP_ID = (process.env.NEXT_PUBLIC_WORLD_APP_ID ?? "") as `app_${string}`;
const ACTION = process.env.NEXT_PUBLIC_WORLD_ACTION_ID ?? "verify-human";

/**
 * One-time proof-of-personhood gate shown before the first payment.
 * verification_level=device → any World App user can pass (no Orb needed).
 * Includes a demo-mode skip so a flaky network never blocks the stage demo.
 */
export function WorldGate({ onVerified }: { onVerified: () => void }) {
  async function handleVerify(result: ISuccessResult) {
    const res = await fetch("/api/verify-world", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error ?? "verification failed");
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur">
      <ShieldCheck className="mx-auto text-cyan-300" size={28} />
      <p className="mt-3 font-semibold">Verify you&apos;re human</p>
      <p className="mt-1 text-sm text-white/50">
        One-time, sybil-resistant check before your first payment. No personal data shared.
      </p>

      <IDKitWidget
        app_id={APP_ID}
        action={ACTION}
        verification_level={VerificationLevel.Device}
        handleVerify={handleVerify}
        onSuccess={onVerified}
      >
        {({ open }) => (
          <button
            onClick={open}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-400 py-3 font-semibold text-black transition hover:opacity-90"
          >
            <UserCheck size={18} /> Verify with World ID
          </button>
        )}
      </IDKitWidget>

      <button
        onClick={onVerified}
        className="mt-3 text-xs text-white/40 underline-offset-2 transition hover:text-white/70 hover:underline"
      >
        Skip (demo mode)
      </button>
    </div>
  );
}
