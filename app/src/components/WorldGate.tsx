"use client";

import { useState } from "react";
import { IDKitWidget, useIDKit, VerificationLevel, type ISuccessResult } from "@worldcoin/idkit";
import { ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";

const APP_ID = (process.env.NEXT_PUBLIC_WORLD_APP_ID ?? "") as `app_${string}`;
const ACTION = process.env.NEXT_PUBLIC_WORLD_ACTION_ID ?? "verify-human";

/**
 * Optional proof-of-personhood. Uses the hook-controlled IDKit pattern
 * (useIDKit + setOpen) rather than the render-prop child, which infinite-loops
 * under React 19. OPTIONAL and off the critical payment path — never blocks a payment.
 */
export function WorldVerify() {
  const { setOpen } = useIDKit();
  const [status, setStatus] = useState<"idle" | "verifying" | "done">("idle");

  async function handleVerify(result: ISuccessResult) {
    setStatus("verifying");
    const res = await fetch("/api/verify-world", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result),
    });
    const data = await res.json();
    if (!data.ok) {
      setStatus("idle");
      throw new Error(data.error ?? "verification failed");
    }
  }

  if (status === "done") {
    return (
      <div className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-400/10 py-2 text-xs text-emerald-300">
        <CheckCircle2 size={14} /> Verified human · World ID
      </div>
    );
  }

  return (
    <>
      {APP_ID && (
        <IDKitWidget
          app_id={APP_ID}
          action={ACTION}
          verification_level={VerificationLevel.Device}
          handleVerify={handleVerify}
          onSuccess={() => setStatus("done")}
        />
      )}
      <button
        onClick={() => setOpen(true)}
        disabled={status === "verifying"}
        className="mt-3 flex w-full items-center justify-center gap-1.5 text-xs text-white/50 transition hover:text-white/80 disabled:opacity-50"
      >
        {status === "verifying" ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <ShieldCheck size={13} />
        )}
        Verify you&apos;re human with World ID (optional)
      </button>
    </>
  );
}
